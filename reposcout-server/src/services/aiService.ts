import {InferenceClient} from "@huggingface/inference";
import prisma from "../lib/prisma";
import { z } from "zod";
import { getChatModel, isConfigured, otherProvider, toProvider } from "../lib/llm";

const hf = new InferenceClient(process.env.HUGGINGFACE_ACCESS_TOKEN);
const EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2";

const sleep  = (ms: number) => new Promise((resolve)=> setTimeout(resolve,ms));

export const generateEmbedding = async (text: string) : Promise<number[]> => {
    const maxRetries =3;

    for(let attempt=1; attempt<=maxRetries; attempt++) {
        try {
            const output = await hf.featureExtraction({
                model: EMBEDDING_MODEL,
                inputs: text,
                provider: "hf-inference",
            });

            if (Array.isArray(output)) {
                if (Array.isArray(output[0])) return output[0] as number[];
                return output as number[];
            }

            throw new Error("Invalid embedding output format");
            
        } catch (error: any) {
            const status = error?.response?.status;

            if (status === 503 || error.message?.includes("loading")) {
                console.warn(
                    `[AI Service] Embedding model loading (attempt ${attempt}/${maxRetries})`
                );
                await sleep(5000);
                continue;
            }

            console.error("[AI Service] Embedding generation failed:", error);
            throw error;
        }
    }
    throw new Error("Embedding model unavailable after retries");
}

export const findRelevantChunks = async (question: string, repoId: string) => {
    console.log(`[AI Service] Searching context for repo ${repoId}`);

    const questionVector = await generateEmbedding(question);

    const result = await prisma.$queryRaw`
        SELECT
            "CodeChunk"."content",
            "CodeChunk"."startLine",
            "CodeChunk"."endLine",
            "RepoFile"."filePath",
            1 - ("CodeChunk"."vector" <=> ${JSON.stringify(questionVector)}::vector) AS similarity
        FROM "CodeChunk"
        JOIN "RepoFile" ON "CodeChunk"."fileId" = "RepoFile"."id"
        WHERE "RepoFile"."repoId" = ${repoId}
        ORDER BY similarity DESC
        LIMIT 5;`

        return result as any[]
}

const answerSchema = z.object({
    answer: z.string().describe("The answer to the question, in Markdown."),
    sourceIndices: z
        .array(z.number().int())
        .describe("Index numbers of ALL source blocks used in the answer, e.g. [0, 2, 3]."),
});

export const generateAnswer = async (question: string, repoId: string, llm: string): Promise<any> => {
    const contextChunks = await findRelevantChunks(question, repoId);

    if (contextChunks.length === 0) {
        return {
            answer: "I could not find relevant code in this repository.",
            sources: null,
        };
    }

    const contextString = contextChunks.map((chunk, index) =>
        `[Source ${index}]: File: ${chunk.filePath} (Lines ${chunk.startLine}-${chunk.endLine})
${chunk.content}`
    ).join("\n\n---\n\n");

    const prompt = `
You are an expert software engineer.
Answer the question using the provided code context.

Question:
"${question}"

Context:
${contextString}

Rules:
1. Cite files and functions explicitly in your explanation.
2. If the answer is not present in the context, say "I cannot answer this based on the provided code."
3. In sourceIndices, list the index numbers (0-${contextChunks.length - 1}) of ALL source blocks you used.
   - For simple questions, this might be just one source: [2]
   - For questions like "where is X used?", include ALL files that use it: [0, 2, 3]
`;

    const primary = toProvider(llm);
    const fallback = otherProvider(primary);

    const chain = getChatModel(primary).withStructuredOutput(answerSchema, { name: "answer" });
    const withFallback = isConfigured(fallback)
        ? chain.withFallbacks([getChatModel(fallback).withStructuredOutput(answerSchema, { name: "answer" })])
        : chain;

    let result: z.infer<typeof answerSchema>;

    try {
        result = await withFallback.invoke(prompt);
    } catch (error) {
        console.error(`[AI Service] ${primary} and fallback failed:`, error);
        return {
            answer: "The AI service is currently unavailable. Please try again shortly.",
            sources: null,
        };
    }

    let relevantIndices = [...new Set(result.sourceIndices)]
        .filter(n => n >= 0 && n < contextChunks.length);

    console.log(`[AI Service] LLM selected sources: ${relevantIndices.join(', ')}`);

    // Fallback to top result if no valid sources found
    if (relevantIndices.length === 0) {
        console.log(`[AI Service] No valid sources returned. Defaulting to top vector match.`);
        relevantIndices = [0];
    }

    // Build sources array with file info for each relevant chunk
    const sources = relevantIndices.map(index => {
        const chunk = contextChunks[index];
        return {
            filePath: chunk.filePath,
            startLine: chunk.startLine,
            endLine: chunk.endLine,
            similarity: chunk.similarity,
        };
    });

    return {
        answer: result.answer.trim(),
        sources,
    };
}
