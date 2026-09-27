import { ChatGoogle } from "@langchain/google";
import { ChatGroq } from "@langchain/groq";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { AsyncCaller } from "@langchain/core/utils/async_caller";

export type LlmProvider = "gemini" | "groq";

const GEMINI_MODEL = "gemini-3-flash-preview";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const MAX_RETRIES = 3;

// LangChain's own retry rules (which errors to retry, rate-limit handling), reused so
// we can log retries without changing when they happen.
const defaultFailedAttemptHandler = (new AsyncCaller({}) as any).onFailedAttempt as (error: unknown) => unknown;

const logRetries = (llm: LlmProvider) => (error: any) => {
    defaultFailedAttemptHandler(error); // throws if the error should not be retried
    const status = error?.status ?? error?.statusCode ?? error?.response?.status ?? "no status";
    console.warn(`[LLM] ${llm} call failed (${status}), retrying: ${String(error?.message ?? error).slice(0, 150)}`);
};

const apiKey = (llm: LlmProvider): string | undefined =>
    llm === "groq" ? process.env.GROQ_API_KEY : process.env.GEMINI_API_KEY;

export const toProvider = (llm: string): LlmProvider => (llm === "groq" ? "groq" : "gemini");

export const otherProvider = (llm: LlmProvider): LlmProvider => (llm === "groq" ? "gemini" : "groq");

export const isConfigured = (llm: LlmProvider): boolean => Boolean(apiKey(llm));

export interface ChatModelOptions {
    // Gemini only. Lower levels answer faster; leave unset for the model's default.
    thinkingLevel?: "low" | "medium" | "high";
}

export const getChatModel = (llm: LlmProvider, options: ChatModelOptions = {}): BaseChatModel => {
    if (llm === "groq") {
        return new ChatGroq({
            apiKey: apiKey("groq"),
            model: GROQ_MODEL,
            temperature: 0.3,
            maxTokens: 1024,
            maxRetries: MAX_RETRIES,
            onFailedAttempt: logRetries("groq"),
        });
    }

    return new ChatGoogle({
        apiKey: apiKey("gemini"),
        model: GEMINI_MODEL,
        maxRetries: MAX_RETRIES,
        onFailedAttempt: logRetries("gemini"),
        ...(options.thinkingLevel ? { thinkingLevel: options.thinkingLevel } : {}),
    });
};
