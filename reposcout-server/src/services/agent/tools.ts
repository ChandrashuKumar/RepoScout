import { tool } from "@langchain/core/tools";
import { z } from "zod";
import prisma from "../../lib/prisma";
import { findRelevantChunks } from "../aiService";

const MAX_CHUNK_CHARS = 1500;
const MAX_READ_LINES = 300;
const MAX_READ_CHARS = 20000;
const MAX_LIST_ENTRIES = 200;
const MAX_GREP_MATCHES = 30;
const MAX_GREP_LINE_CHARS = 200;

export interface AgentSource {
    filePath: string;
    startLine: number;
    endLine: number;
}

/**
 * Remembers every piece of code the tools showed the model, under a short
 * id like "S3". The model cites these ids in submitAnswer, and the ids are
 * turned back into file paths and line ranges for the client.
 */
export class SourceTracker {
    private byId = new Map<string, AgentSource>();
    private idByKey = new Map<string, string>();

    add(source: AgentSource): string {
        const key = `${source.filePath}:${source.startLine}-${source.endLine}`;
        const existing = this.idByKey.get(key);
        if (existing) return existing;

        const id = `S${this.byId.size + 1}`;
        this.byId.set(id, source);
        this.idByKey.set(key, id);
        return id;
    }

    get(id: string): AgentSource | undefined {
        return this.byId.get(id.trim().toUpperCase());
    }

    all(): AgentSource[] {
        return [...this.byId.values()];
    }
}

const escapeLike = (text: string) => text.replace(/[\\%_]/g, (c) => `\\${c}`);

export const submitAnswerSchema = z.object({
    answer: z.string().describe("The final answer to the user's question, in Markdown. Cite file paths."),
    sourceIds: z
        .array(z.string())
        .describe('Ids of ALL sources the answer relies on, e.g. ["S1", "S4"].'),
});

export const SUBMIT_ANSWER = "submitAnswer";

// The loop never executes this tool. When the model calls it, the loop
// reads the arguments as the final answer and stops.
export const submitAnswerTool = tool(async () => "", {
    name: SUBMIT_ANSWER,
    description: "Call this once you have enough information, to give the final answer. This ends the task.",
    schema: submitAnswerSchema,
});

export const makeTools = (repoId: string, tracker: SourceTracker) => {
    const searchCode = tool(
        async ({ query }) => {
            const chunks = await findRelevantChunks(query, repoId);
            if (chunks.length === 0) return "No matching code found.";

            return chunks.map((chunk) => {
                const id = tracker.add({
                    filePath: chunk.filePath,
                    startLine: chunk.startLine,
                    endLine: chunk.endLine,
                });
                const content = chunk.content.length > MAX_CHUNK_CHARS
                    ? `${chunk.content.slice(0, MAX_CHUNK_CHARS)}\n... (chunk truncated, use readFile for the rest)`
                    : chunk.content;
                return `[${id}] ${chunk.filePath} (lines ${chunk.startLine}-${chunk.endLine})\n${content}`;
            }).join("\n\n---\n\n");
        },
        {
            name: "searchCode",
            description: "Semantic search over the repository's code. Best for concepts and behavior, e.g. 'how are uploads validated'. Returns the 5 most similar code chunks.",
            schema: z.object({
                query: z.string().describe("What to look for, in plain words."),
            }),
        }
    );

    const readFile = tool(
        async ({ path, startLine, endLine }) => {
            if (startLine !== undefined && endLine !== undefined && endLine < startLine) {
                return `Error: endLine (${endLine}) is before startLine (${startLine}). endLine is a line number, not a line count. To read ${endLine} lines from line ${startLine}, use endLine=${startLine + endLine - 1}.`;
            }

            const file = await prisma.repoFile.findFirst({
                where: { repoId, filePath: path },
                select: { filePath: true, content: true },
            });

            if (!file) {
                const name = path.split("/").pop() ?? path;
                const similar = await prisma.repoFile.findMany({
                    where: { repoId, filePath: { contains: name } },
                    select: { filePath: true },
                    take: 5,
                });
                const hint = similar.length
                    ? ` Similar paths: ${similar.map((f) => f.filePath).join(", ")}`
                    : " Use listFiles to see available paths.";
                return `No file at "${path}".${hint}`;
            }

            const lines = (file.content ?? "").split("\n");
            const start = Math.max(1, startLine ?? 1);
            const end = Math.min(lines.length, endLine ?? start + MAX_READ_LINES - 1, start + MAX_READ_LINES - 1);

            if (start > lines.length) {
                return `${file.filePath} has only ${lines.length} lines.`;
            }

            let body = "";
            let lastLine = start - 1;
            for (let i = start; i <= end; i++) {
                const line = `${i}: ${lines[i - 1]}\n`;
                if (body.length + line.length > MAX_READ_CHARS) break;
                body += line;
                lastLine = i;
            }

            const id = tracker.add({ filePath: file.filePath, startLine: start, endLine: lastLine });
            const more = lastLine < lines.length
                ? `\n... (${lines.length - lastLine} more lines; call readFile with startLine=${lastLine + 1} to continue)`
                : "";

            return `[${id}] ${file.filePath} (lines ${start}-${lastLine} of ${lines.length})\n${body}${more}`;
        },
        {
            name: "readFile",
            description: `Read a file by its exact path, with line numbers. Returns at most ${MAX_READ_LINES} lines per call; use startLine/endLine for longer files.`,
            schema: z.object({
                path: z.string().describe("File path exactly as shown by listFiles, grep or searchCode."),
                startLine: z.number().int().optional().describe("First line to read (1-based)."),
                endLine: z.number().int().optional().describe("Last line number to read (inclusive), not a count."),
            }),
        }
    );

    const listFiles = tool(
        async ({ prefix }) => {
            const files = await prisma.repoFile.findMany({
                where: { repoId, ...(prefix ? { filePath: { startsWith: prefix } } : {}) },
                select: { filePath: true },
                orderBy: { filePath: "asc" },
                take: MAX_LIST_ENTRIES + 1,
            });

            if (files.length === 0) {
                return prefix ? `No indexed files under "${prefix}".` : "This repository has no indexed files.";
            }

            const shown = files.slice(0, MAX_LIST_ENTRIES).map((f) => f.filePath).join("\n");
            const more = files.length > MAX_LIST_ENTRIES
                ? `\n... (more files not shown; pass a longer prefix to narrow it down)`
                : "";
            return shown + more;
        },
        {
            name: "listFiles",
            description: "List indexed file paths, optionally only those starting with a prefix such as 'src/components/'. Images, lockfiles, styles and build output are not indexed.",
            schema: z.object({
                prefix: z.string().optional().describe("Only return paths starting with this."),
            }),
        }
    );

    const grep = tool(
        async ({ pattern }) => {
            const files = await prisma.$queryRaw<{ filePath: string; content: string }[]>`
                SELECT "filePath", "content"
                FROM "RepoFile"
                WHERE "repoId" = ${repoId}
                  AND "content" ILIKE ${`%${escapeLike(pattern)}%`} ESCAPE '\\'
                ORDER BY "filePath"`;

            if (files.length === 0) return `No matches for "${pattern}".`;

            const needle = pattern.toLowerCase();
            const matches: string[] = [];
            let total = 0;

            for (const file of files) {
                file.content.split("\n").forEach((line, index) => {
                    if (!line.toLowerCase().includes(needle)) return;
                    total++;
                    if (matches.length >= MAX_GREP_MATCHES) return;

                    const lineNumber = index + 1;
                    const id = tracker.add({ filePath: file.filePath, startLine: lineNumber, endLine: lineNumber });
                    const text = line.trim().slice(0, MAX_GREP_LINE_CHARS);
                    matches.push(`[${id}] ${file.filePath}:${lineNumber}: ${text}`);
                });
            }

            const more = total > matches.length
                ? `\n... (${total - matches.length} more matches in ${files.length} files; use a more specific pattern)`
                : "";
            return matches.join("\n") + more;
        },
        {
            name: "grep",
            description: "Case-insensitive exact text search across all indexed files. Best for identifiers, e.g. a function or variable name, to find where it is defined and used.",
            schema: z.object({
                pattern: z.string().min(2).describe("Plain text to find (not a regex)."),
            }),
        }
    );

    return [searchCode, readFile, listFiles, grep];
};
