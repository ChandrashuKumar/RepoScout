import { AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { StructuredToolInterface } from "@langchain/core/tools";
import { traceable } from "langsmith/traceable";
import { getChatModel, isConfigured, LlmProvider, otherProvider, toProvider } from "../../lib/llm";
import { AgentSource, makeTools, SourceTracker, SUBMIT_ANSWER, submitAnswerSchema, submitAnswerTool } from "./tools";

const MAX_STEPS = 8;
const TIME_LIMIT_MS = 90_000;
const FINAL_CALL_TIME_LIMIT_MS = 20_000;
const MAX_HISTORY_TURNS = 6;
const MAX_HISTORY_CHARS = 2000;
const MAX_HANDOFF_CHARS = 30_000;
const MAX_FALLBACK_SOURCES = 5;

export interface ChatTurn {
    sender: "user" | "ai";
    message: string;
}

export interface AgentStep {
    tool: string;
    input: string;
}

export interface AgentResult {
    answer: string;
    sources: AgentSource[] | null;
    steps: AgentStep[];
}

const systemPrompt = (repoName: string) => `
You are an expert software engineer answering questions about the "${repoName}" repository.
You cannot see the code up front. Use the tools to look things up before answering.

How to research:
- grep: exact names (functions, variables, env vars, routes). Use it for "where is X used/defined".
- searchCode: concepts and behavior when you don't know the names yet.
- readFile: read the relevant part of a file to confirm how code works. Prefer this over guessing from a short chunk.
- listFiles: see how the project is organized.
- You have at most ${MAX_STEPS} rounds of tool calls, so be efficient. You can call several tools in one round.

Every tool result is labeled with a source id like [S3].

When you know the answer, call ${SUBMIT_ANSWER} with:
- answer: a clear explanation in Markdown that names the files and functions involved.
- sourceIds: the ids of ALL sources your answer relies on.
If the code does not contain the answer, say so in ${SUBMIT_ANSWER} instead of guessing.
`.trim();

const truncate = (text: string, max: number) => (text.length > max ? `${text.slice(0, max)}...` : text);

const describeArgs = (args: Record<string, unknown>) =>
    truncate(Object.values(args).filter((v) => v !== undefined).map(String).join(", "), 120);

const toHistoryMessages = (history: ChatTurn[]): BaseMessage[] =>
    history.slice(-MAX_HISTORY_TURNS).map((turn) => {
        const text = truncate(turn.message, MAX_HISTORY_CHARS);
        return turn.sender === "user" ? new HumanMessage(text) : new AIMessage(text);
    });

/**
 * Turns this run's tool calls and results into one plain-text message.
 * Used when switching provider mid-run: provider-specific data in the
 * messages (like Gemini's thought signatures) would not make sense to the
 * other model, but the findings still do.
 */
const toHandoffMessage = (work: BaseMessage[], failedProvider: LlmProvider): HumanMessage => {
    const lines: string[] = [];
    for (const message of work) {
        if (AIMessage.isInstance(message)) {
            for (const call of message.tool_calls ?? []) {
                lines.push(`Called ${call.name}(${JSON.stringify(call.args)})`);
            }
        } else if (ToolMessage.isInstance(message)) {
            lines.push(`Result:\n${message.text}`);
        }
    }

    let research = lines.join("\n\n");
    if (research.length > MAX_HANDOFF_CHARS) {
        research = `...(earlier results cut)\n${research.slice(-MAX_HANDOFF_CHARS)}`;
    }

    return new HumanMessage(
        `Another model (${failedProvider}) started researching this question and stopped because of an error. ` +
        `Its tool calls and results so far are below. Continue from here; source ids are still valid.\n\n` +
        (research || "(no research done yet)")
    );
};

const buildResult = (
    answer: string,
    sourceIds: string[] | null,
    tracker: SourceTracker,
    steps: AgentStep[]
): AgentResult => {
    const cited: AgentSource[] = [];
    for (const id of sourceIds ?? []) {
        const source = tracker.get(id);
        if (source && !cited.includes(source)) cited.push(source);
    }

    // Nothing valid cited: fall back to the first things the agent looked at.
    const sources = cited.length > 0 ? cited : tracker.all().slice(0, MAX_FALLBACK_SOURCES);

    return {
        answer: answer.trim(),
        sources: sources.length > 0 ? sources : null,
        steps,
    };
};

/** Reads the model's reply. Returns a result if the run is over, or null if it asked for more tools. */
const readFinalAnswer = (response: AIMessage, tracker: SourceTracker, steps: AgentStep[]): AgentResult | null => {
    const submit = response.tool_calls?.find((call) => call.name === SUBMIT_ANSWER);
    if (submit) {
        const parsed = submitAnswerSchema.safeParse(submit.args);
        if (parsed.success) return buildResult(parsed.data.answer, parsed.data.sourceIds, tracker, steps);
        if (typeof submit.args.answer === "string") return buildResult(submit.args.answer, null, tracker, steps);
    }

    if (!response.tool_calls?.length && response.text.trim()) {
        return buildResult(response.text, null, tracker, steps);
    }

    return null;
};

const runAgentImpl = async (
    question: string,
    repoId: string,
    repoName: string,
    llm: string,
    history: ChatTurn[] = []
): Promise<AgentResult> => {
    const tracker = new SourceTracker();
    const tools = makeTools(repoId, tracker);
    const toolsByName = new Map<string, StructuredToolInterface>(tools.map((t) => [t.name, t]));
    const allTools = [...tools, submitAnswerTool];
    const steps: AgentStep[] = [];

    let provider = toProvider(llm);
    let switched = false;
    let model = getChatModel(provider).bindTools!(allTools);

    const base: BaseMessage[] = [
        new SystemMessage(systemPrompt(repoName)),
        ...toHistoryMessages(history),
        new HumanMessage(question),
    ];
    // Messages produced during this run: model replies and tool results.
    let work: BaseMessage[] = [];

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIME_LIMIT_MS);

    try {
        let rounds = 0;
        while (rounds < MAX_STEPS) {
            let response: AIMessage;
            try {
                response = await model.invoke([...base, ...work], { signal: controller.signal });
            } catch (error) {
                if (controller.signal.aborted) break;

                const fallback = otherProvider(provider);
                if (switched || !isConfigured(fallback)) throw error;

                console.warn(`[Agent] ${provider} failed, switching to ${fallback}:`, error);
                work = work.length > 0 ? [toHandoffMessage(work, provider)] : [];
                steps.push({ tool: "switchModel", input: `${provider} failed, continuing with ${fallback}` });
                provider = fallback;
                model = getChatModel(provider).bindTools!(allTools);
                switched = true;
                continue;
            }

            rounds++;
            work.push(response);

            const result = readFinalAnswer(response, tracker, steps);
            if (result) return result;

            for (const call of response.tool_calls ?? []) {
                steps.push({ tool: call.name, input: describeArgs(call.args) });

                const selected = toolsByName.get(call.name);
                let output: string;
                try {
                    output = selected
                        ? String(await selected.invoke(call.args))
                        : `Error: unknown tool "${call.name}".`;
                } catch (error: any) {
                    output = `Error: ${error?.message ?? String(error)}`;
                }

                work.push(new ToolMessage({ content: output, tool_call_id: call.id!, name: call.name }));
            }
        }
    } catch (error) {
        console.error(`[Agent] ${provider} failed:`, error);
        return {
            answer: "The AI service is currently unavailable. Please try again shortly.",
            sources: null,
            steps,
        };
    } finally {
        clearTimeout(timer);
    }

    // Out of rounds or time: one last call asking for an answer from what was found.
    const reason = controller.signal.aborted ? "time limit" : "step limit";
    console.log(`[Agent] Hit ${reason}, asking for a final answer.`);
    steps.push({ tool: "limitReached", input: reason });

    try {
        const response = await model.invoke(
            [
                ...base,
                ...work,
                new HumanMessage(`You've reached the ${reason}. Do not call any more research tools. Call ${SUBMIT_ANSWER} now with what you have found.`),
            ],
            { signal: AbortSignal.timeout(FINAL_CALL_TIME_LIMIT_MS) }
        );
        const result = readFinalAnswer(response, tracker, steps);
        if (result) return result;
    } catch (error) {
        console.error(`[Agent] Final answer call failed:`, error);
    }

    return buildResult(
        "I couldn't finish researching this question within the limits. Try asking something more specific, or use fast mode.",
        null,
        tracker,
        steps
    );
};

export const runAgent = traceable(runAgentImpl, { name: "deepModeAgent", run_type: "chain" });
