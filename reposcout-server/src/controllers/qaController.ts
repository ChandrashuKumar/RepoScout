import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { generateAnswer } from "../services/aiService";

export const chatWithRepo = async (req: Request, res: Response): Promise<any> => {
    const repoId = req.params.repoId as string;
    const { question, llm = 'gemini' } = req.body;

    if (!question) {
        return res.status(400).json({ error: "Question is required" });
    }

    try {
        const repo = await prisma.repository.findUnique({
            where: { id: repoId }
        });

        if (!repo) {
            return res.status(404).json({ error: "Repository not found" });
        }

        const aiResponse = await generateAnswer(question, repoId, llm);

        res.json(aiResponse);

    } catch (error) {
        console.error("[QA] Error:", error);
        res.status(500).json({ error: "Failed to generate answer" });
    }
}