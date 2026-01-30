import {InferenceClient} from "@huggingface/inference";
import prisma from "../lib/prisma";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

const hf = new InferenceClient(process.env.HUGGINGFACE_ACCESS_TOKEN);
const EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2";

const ai = new GoogleGenAI({});
const GEMINI_MODEL = "gemini-3-flash-preview"
const GEMINI_MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1'
});

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

const generateWithGemini = async (prompt: string): Promise<string> => {

    for (let attempt = 1; attempt <= GEMINI_MAX_RETRIES; attempt++) {
        try {
            const result = await ai.models.generateContent({
                model: GEMINI_MODEL,
                contents: [prompt],
            })
            
            return result.text || '';

        } catch (error: any) {
            const status = error?.status || error?.response?.status;

            if (status === 503 || status === 429) {
                const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
                console.warn(
                    `[AI Service] Gemini overloaded (attempt ${attempt}/${GEMINI_MAX_RETRIES}), retrying in ${delay}ms`
                );
                await sleep(delay);
                continue;
            }

            throw error;
        }
    }

    throw new Error("Gemini unavailable after retries");
};

const GROQ_MAX_RETRIES = 3;

const generateWithGroq = async (prompt: string): Promise<string> => {
    for (let attempt = 1; attempt <= GROQ_MAX_RETRIES; attempt++) {
        try {
            const response = await groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1024,
                temperature: 0.3,
            });

            return response.choices[0].message.content || '';

        } catch (error: any) {
            const status = error?.status || error?.response?.status;

            if (status === 503 || status === 429) {
                const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
                console.warn(
                    `[AI Service] Groq rate limited (attempt ${attempt}/${GROQ_MAX_RETRIES}), retrying in ${delay}ms`
                );
                await sleep(delay);
                continue;
            }

            throw error;
        }
    }

    throw new Error("Groq unavailable after retries");
};

const findRelevantChunks = async (question: string, repoId: string) => {
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
3. CRITICAL: At the very end of your response, on a new line, output the tag "[SOURCES: X, Y, Z]" where X, Y, Z are the index numbers (0-4) of ALL relevant source code blocks you used.
   - For simple questions, this might be just one source: [SOURCES: 2]
   - For questions like "where is X used?", include ALL files that use it: [SOURCES: 0, 2, 3]
   Example:
   The Button component is defined in Button.jsx and used in Home.jsx and Settings.jsx...

   [SOURCES: 0, 1, 3]
`;

    let fullResponse: string;

    try {
        if (llm === 'groq') {
            fullResponse = await generateWithGroq(prompt);
        } else {
            fullResponse = await generateWithGemini(prompt);
        }
    } catch (error) {
        console.error(`[AI Service] ${llm} failed:`, error);
        return {
            answer: "The AI service is currently unavailable. Please try again shortly.",
            sources: null,
        };
    }

    let relevantIndices: number[] = [];
    let cleanAnswer = fullResponse;

    // Parse [SOURCES: X, Y, Z] or [SOURCE: X] format
    const sourcesMatch = fullResponse.match(/\[SOURCES?:\s*([\d,\s]+)\]/i);

    if (sourcesMatch && sourcesMatch[1]) {
        relevantIndices = sourcesMatch[1]
            .split(',')
            .map(s => parseInt(s.trim(), 10))
            .filter(n => !isNaN(n) && n >= 0 && n < contextChunks.length);

        console.log(`[AI Service] LLM selected sources: ${relevantIndices.join(', ')}`);
        cleanAnswer = fullResponse.replace(/\[SOURCES?:\s*[\d,\s]+\]/gi, "").trim();
    }

    // Fallback to top result if no valid sources found
    if (relevantIndices.length === 0) {
        console.log(`[AI Service] No source tags found. Defaulting to top vector match.`);
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
        answer: cleanAnswer,
        sources,
    };
}