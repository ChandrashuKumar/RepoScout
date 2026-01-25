import {InferenceClient} from "@huggingface/inference";

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