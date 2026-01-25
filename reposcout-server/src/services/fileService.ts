import fs from "fs-extra"
import path from "path"

export interface FileNode {
    path: string;
    name: string;
    type: 'file' | 'directory';
    children?: FileNode[];
}

const IGNORED_FOLDERS = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', '.next']);
const IGNORED_FILES = new Set(['package-lock.json', 'yarn.lock', '.DS_Store', '.env']);

export const generateFileTree = async (dirPath: string, relativePath=""): Promise<FileNode[]> => {
    const nodes: FileNode[] = [];
    const items = await fs.readdir(dirPath);
    
    for(const item of items){
        if(IGNORED_FILES.has(item) || IGNORED_FOLDERS.has(item)) continue;
        const fullPath = path.join(dirPath, item);
        const itemRelativePath = path.join(relativePath, item);

        const stats = await fs.stat(fullPath);
        if(stats.isDirectory()){
            const children = await generateFileTree(fullPath, itemRelativePath);
            nodes.push({
                path: itemRelativePath,
                name: item,
                type: 'directory',
                children
            });
        } else {
            nodes.push({
                path: itemRelativePath,
                name: item,
                type: 'file'
            });
        }
    }
    return nodes;
}

export const processFile = async (filePath: string): Promise<string> => {
   
    return await fs.readFile(filePath, 'utf-8');
};