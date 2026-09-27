import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { generateAnswer } from "../services/aiService";
import { ChatTurn, runAgent } from "../services/agent/runAgent";

const MAX_HISTORY_TURNS = 6;

const parseHistory = (history: unknown): ChatTurn[] => {
    if (!Array.isArray(history)) return [];

    return history
        .filter((turn): turn is ChatTurn =>
            typeof turn === "object" && turn !== null &&
            (turn.sender === "user" || turn.sender === "ai") &&
            typeof turn.message === "string"
        )
        .slice(-MAX_HISTORY_TURNS)
        .map(({ sender, message }) => ({ sender, message }));
};

export const chatWithRepo = async (req: Request, res: Response): Promise<any> => {
    const repoId = req.params.repoId as string;
    const { question, llm = 'gemini', mode = 'fast', history } = req.body;

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

        const aiResponse = mode === 'deep'
            ? await runAgent(question, repoId, repo.name, llm, parseHistory(history))
            : await generateAnswer(question, repoId, llm);

        res.json(aiResponse);

    } catch (error) {
        console.error("[QA] Error:", error);
        res.status(500).json({ error: "Failed to generate answer" });
    }
}
