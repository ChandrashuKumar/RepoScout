import { Request, Response } from "express"
import { getRepoFileCount } from "../services/githubService"
import prisma from "../lib/prisma"
import {v4 as uuidv4} from "uuid"
import path from "path"
import simpleGit from "simple-git"
import { generateFileTree, FileNode, processFile } from "../services/fileService"
import { generateEmbedding } from "../services/aiService"
import { ingestionEvents } from "../lib/ingestionEmitter"
import { chunkSourceCode } from "../services/chunkingService"
import fs from "fs-extra"

interface IngestionProgress {
    message: string
    progress: number
    eta: string | null
    timestamp: string
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const emitUpdate = (repoId: string, message: string, progress: number, eta: string | null = null) => {
    ingestionEvents.emit(`progress-${repoId}`, {
        message,
        progress,
        eta,      
        timestamp: new Date().toLocaleTimeString()
    });
};

const generateEmbeddingWithRetry = async (text: string, retries = 3): Promise<number[] | null> => {
    for (let i = 0; i < retries; i++) {
        try {
            return await generateEmbedding(text);
        } catch (error: any) {
            const isRateLimit = error.message?.includes('429') || error.status === 429;

            if (isRateLimit && i < retries - 1) {
                console.warn(`[AI] Rate limit hit. Retrying in ${(i + 1) * 2}s...`);
                await sleep((i + 1) * 2000);
                continue;
            }

            console.error(`[AI] Embedding failed:`, error.message);
            return null;
        }
    }
    return null;
};

type FileResult = 'success' | 'skipped' | 'failed';

const processSingleFile = async (file: any, tempPath: string, repoId: string): Promise<FileResult> => {
    try {
        const fullPath = path.join(tempPath, file.path);
        const content = await processFile(fullPath);

        if (!content || content.length > 30000) return 'skipped';

        const fileRecord = await prisma.repoFile.create({
            data: { filePath: file.path, repoId: repoId, content: content }
        });

        const chunks = chunkSourceCode(content, file.name);

        for (const chunk of chunks) {
            const vector = await generateEmbeddingWithRetry(chunk.content);

            if (!vector) continue;


            await prisma.$executeRaw`
                INSERT INTO "CodeChunk" ("id", "fileId", "startLine", "endLine", "content", "vector", "createdAt")
                VALUES (
                    ${uuidv4()},
                    ${fileRecord.id},
                    ${chunk.startLine},
                    ${chunk.endLine},
                    ${chunk.content},
                    ${JSON.stringify(vector)}::vector,
                    NOW()
                )
            `;


            await sleep(100);
        }

        return 'success';
    } catch (err) {
        console.warn(`[IngestWorker] Error processing ${file.path}:`, err);
        return 'failed';
    }
};

export const streamIngestionProgress = async (req: Request, res: Response) => {
    const {repoId} = req.params;

    console.log(`[SSE] Client connected for repo: ${repoId}`);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders(); 

    const handshake = {
        message: "Connection established. Waiting for logs...",
        progress: 0,
        eta: "Calculating...",
        timestamp: new Date().toLocaleTimeString()
    };
    res.write(`data: ${JSON.stringify(handshake)}\n\n`);

    const onProgress = (data: IngestionProgress) => {
        console.log(`[SSE] Emitting to ${repoId}:`, data.message); 

        res.write(`data: ${JSON.stringify(data)}\n\n`);

        //@ts-ignore
        if(res.flush) res.flush();

        if (data.progress === 100 || data.message.includes("Error")) {
            res.end();
            ingestionEvents.off(`progress-${repoId}`, onProgress);
        }
    }

    ingestionEvents.on(`progress-${repoId}`, onProgress);

    req.on('close', () => {
        console.log(`[SSE] Client disconnected: ${repoId}`);
        ingestionEvents.off(`progress-${repoId}`, onProgress);
    });
}

const performIngestion = async (repoId: string, repoUrl: string, tempPath: string) => {
    try {
        console.log(`[IngestWorker] Starting background job for: ${repoUrl}`);
        await simpleGit().clone(repoUrl, tempPath);

        const fileTree = await generateFileTree(tempPath);

        const flattenFiles = (nodes: FileNode[]): FileNode[] => {
            let files: FileNode[] = [];
            for (const node of nodes) {
                if (node.type === 'file') files.push(node);
                else if (node.children) files = files.concat(flattenFiles(node.children));
            }
            return files;
        }

        const allFiles = flattenFiles(fileTree);

        const IGNORED_EXTENSIONS = new Set([
            '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
            '.lock', '.map', '.css', '.scss','.config','.csv',
            '.editorconfig', '.gitignore'
        ]);

        const filesToProcess = allFiles.filter(file => {
            if (file.path.includes('node_modules') ||
                file.path.includes('.git') ||
                file.path.includes('dist') ||
                file.path.includes('build') ||
                file.path.includes('coverage')) return false;

            const ext = path.extname(file.name).toLowerCase();
            return !IGNORED_EXTENSIONS.has(ext);
        });

        console.log(`[IngestWorker] Filtered down to ${filesToProcess.length} valid files.`);
        emitUpdate(repoId, `Found ${filesToProcess.length} valid source files. Starting ingestion...`, 15);

        const BATCH_SIZE = 5;
        const totalFiles = filesToProcess.length;
        const startTime = Date.now();
        let processedCount = 0;
        let successCount = 0;
        let skippedCount = 0;
        let failedCount = 0;

        for(let i=0; i<totalFiles; i+=BATCH_SIZE) {
            const batch = filesToProcess.slice(i, i + BATCH_SIZE);
            console.log(`[IngestWorker] Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} files)...`);
            const elapsedSeconds = (Date.now() - startTime) / 1000;
            const filesPerSecond = processedCount > 0 ? processedCount / elapsedSeconds : 0;
            const remainingFiles = totalFiles - processedCount;
            const etaSeconds = filesPerSecond > 0 ? Math.ceil(remainingFiles / filesPerSecond) : 0;

            const etaText = etaSeconds > 60
                ? `${Math.floor(etaSeconds / 60)}m ${etaSeconds % 60}s`
                : `${etaSeconds}s`;

            const currentProgress = 15 + Math.floor((processedCount / totalFiles) * 80);

            emitUpdate(
                repoId,
                `Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} files)...`,
                currentProgress,
                filesPerSecond > 0 ? etaText : "Calculating..."
            );

            const results = await Promise.all(
                batch.map(file => processSingleFile(file, tempPath, repoId))
            );

            for (const result of results) {
                if (result === 'success') successCount++;
                else if (result === 'skipped') skippedCount++;
                else if (result === 'failed') failedCount++;
            }

            processedCount += batch.length;
        }

        await prisma.repository.update({
            where: { id: repoId },
            data: { status: "COMPLETED" }
        });

        const processableFiles = totalFiles - skippedCount;
        const successRate = processableFiles > 0 ? Math.round((successCount / processableFiles) * 100) : 100;
        const WARNING_THRESHOLD = 80;

        let finalMessage = `Ingestion complete! ${successCount} files processed`;
        if (skippedCount > 0) finalMessage += `, ${skippedCount} skipped (too large)`;
        if (failedCount > 0) finalMessage += `, ${failedCount} failed`;
        if (successRate < WARNING_THRESHOLD) finalMessage += `. Warning: Low success rate (${successRate}%). Consider re-ingesting.`;

        console.log(`[IngestWorker] Job Complete. Success: ${successCount}, Skipped: ${skippedCount}, Failed: ${failedCount}, Rate: ${successRate}%`);
        emitUpdate(repoId, finalMessage, 100, "Done");
        
        await fs.remove(tempPath);

    } catch (error) {
        console.error('[IngestWorker] FAILED:', error);
        await prisma.repository.update({ where: { id: repoId }, data: { status: "FAILED" } });
        await fs.remove(tempPath).catch(() => { });
    }
}


export const ingestRepo = async(req: Request, res: Response) : Promise<any> => {
    const {repoUrl, repoName} = req.body;
    const userId = req.user?.id;

    const existing = await prisma.repository.findFirst({
        where: {
            userId: userId,
            url: repoUrl
        }
    });

    if (existing) {
        return res.status(200).json({
            message: "Repository already exists",
            id: existing.id,
            status: existing.status
        });
    }

    if (!userId) return res.status(401).json({ error: "User not authenticated" });
    if (!repoName || !repoUrl) return res.status(400).json({ error: "Missing Name/URL" });

    const FILE_LIMIT = 300;
    const fileCount = await getRepoFileCount(repoUrl);

    if (fileCount === -1) {
        return res.status(400).json({
            error: 'GITHUB_API_ERROR',
            message: 'Could not verify repository size. Please check the URL and try again.'
        });
    }

    if (fileCount > FILE_LIMIT) {
        return res.status(400).json({
            error: 'REPO_TOO_LARGE',
            message: `This repository has ${fileCount} source files. The Free Tier limit is ${FILE_LIMIT} files.`,
            fileCount
        });
    }

    try {
        const repo = await prisma.repository.create({
            data: {
                name: repoName,
                url: repoUrl,
                userId: userId,
                status: "INGESTING"
            }
        });

        const processingId = uuidv4();
        const tempPath = path.join(__dirname, '../../temp', processingId);

        performIngestion(repo.id, repoUrl, tempPath);

        return res.status(200).json({
            message: "Ingestion started.",
            id: repo.id,
            status: "INGESTING"
        });

    } catch (error) {
        console.error('[Ingest] Failed to start:', error);
        return res.status(500).json({ error: "Failed to start ingestion" });
    }
}