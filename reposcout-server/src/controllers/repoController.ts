import {Request, Response} from 'express';
import prisma from '../lib/prisma';


export const getUserRepos = async (req: Request, res: Response): Promise<any> => {
    const userId = req.user?.id;

    if(!userId){
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const repos = await prisma.repository.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(repos);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch repositories" });
    }
};

export const deleteRepo = async (req: Request, res: Response): Promise<any> => {
    const { repoId } = req.params;

    const userId = req.user?.id;

    try{
        const repo = await prisma.repository.findFirst({
            where: { id: repoId as string, userId: userId }
        });

        if(!repo){
            return res.status(404).json({ error: "Repository not found" });
        }

        await prisma.repository.delete({
            where: { id: repoId as string }
        });

        res.json({ message: "Repository deleted successfully" });

    } catch (error) {
        res.status(500).json({ error: "Failed to delete repository" });
    }
}

export const getRepoStatus = async (req: Request, res: Response): Promise<any> => {
    const repoId = req.params.repoId as string;

    if (!repoId) {
        return res.status(400).json({ error: "Repository ID is required" });
    }

    try{
        const repo = await prisma.repository.findUnique({
            where : {id: repoId},
            select : {
                status:true
            }
        })

        if(!repo){
            return res.status(404).json({ error: "Repository not found" });
        }

        res.json(repo);

    } catch (error) {
        res.status(500).json({ error: "Failed to fetch status" });
    }
}

export const getRepoGraph = async (req: Request, res: Response): Promise<any> => {
    const repoId = req.params.repoId as string;

    try{
        const repo = await prisma.repository.findUnique({
        where: {id: repoId},
        select: {name: true}
    });

    if(!repo){
        return res.status(404).json({ error: "Repo not found" });
    }

    const files = await prisma.repoFile.findMany({
        where: {repoId: repoId},
        select : {
            id: true,
            filePath: true
        }
    });

    const nodesMap = new Map();
    const edgesMap = new Map();

    const rootId="ROOT";
    nodesMap.set(rootId, {
        id: rootId,
        type: 'root',
        data: {label: repo.name}
    });
    
    files.forEach((file) => {
        const normalizedPath = file.filePath.replace(/\\/g, '/');
        const parts = normalizedPath.split('/');

        let currentPath="";
        parts.forEach((part,index)=> {
            const parentPath=currentPath;
            currentPath = currentPath? `${currentPath}/${part}`: part;
            const isFile = index === parts.length-1;
            
            if(!nodesMap.has(currentPath)){
                nodesMap.set(currentPath,{
                    id: currentPath,
                    type: isFile? 'file': 'folder',
                    data : {
                        label: part,
                        dbId : isFile? file.id: null
                    }
                })
            }

            const sourceId = parentPath ? parentPath : rootId;
                const targetId = currentPath;
                const edgeId = `e-${sourceId}-${targetId}`;

                if (!edgesMap.has(edgeId)) {
                    edgesMap.set(edgeId, {
                        id: edgeId,
                        source: sourceId,
                        target: targetId,
                        type: 'default',
                        animated: true,
                        style: { stroke: '#475569', strokeWidth: 2 }
                    });
                }
        });
    });

    const nodes = Array.from(nodesMap.values());
    const edges = Array.from(edgesMap.values());

    res.json({ nodes, edges });

    } catch (error) {
        res.status(500).json({ error: "Failed to fetch repo graph" });
    }   
}

export const getFileContent = async(req: Request, res: Response) : Promise<any> => {
    const fileId = req.params.fileId as string;

    try{
        const file = await prisma.repoFile.findUnique({
            where: { id: fileId },
            select: { content: true }
        });

        if (!file || !file.content) {
            return res.status(404).json({ error: "File content not found" });
        }

        res.json({ content: file.content });
    }
    catch(error){
        res.status(500).json({error: "Failed to get file content"})
    }
};

