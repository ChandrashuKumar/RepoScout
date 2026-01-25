import ts from 'typescript';

export interface CodeChunk {
    content: string,
    startLine: number,
    endLine: number
}

const chunkArbitraryFile = (sourceCode: string, maxLines: number) : CodeChunk[] => {
    const lines = sourceCode.split('\n');
    const chunks: CodeChunk[] = [];

    let currentLine = 1;
    for(let i = 0; i < lines.length; i += maxLines) {
        const endLine = Math.min(currentLine+maxLines-1, lines.length);
        const chunkLines = lines.slice(i, i+maxLines);
        const content = chunkLines.join('\n');

        chunks.push({
            content,
            startLine: currentLine,
            endLine: endLine
        });

        currentLine += maxLines;
    }

    return chunks;
}
const chunkTypescriptCode = (sourceCode: string, fileName: string) : CodeChunk[] => {
    const chunks: CodeChunk[] = [];

    const sourceFile = ts.createSourceFile(
        fileName,
        sourceCode,
        ts.ScriptTarget.Latest,
        true
    );
    
    const visit  = (node: ts.Node) => {
        if(ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) || ts.isMethodDeclaration(node) || ts.isArrowFunction(node)) {
            const start = node.getStart(sourceFile);
            const end = node.getEnd();

            const startLine = sourceFile.getLineAndCharacterOfPosition(start).line + 1;
            const endLine = sourceFile.getLineAndCharacterOfPosition(end).line + 1;

            const content = sourceCode.substring(start, end);

            chunks.push({ content, startLine, endLine });
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    if (chunks.length === 0 && sourceCode.trim().length > 0) {
        return chunkArbitraryFile(sourceCode, 100);
    }

    return chunks;
}

export const chunkSourceCode = (sourceCode: string, fileName: string): CodeChunk[] => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    if (['ts', 'tsx', 'js', 'jsx'].includes(extension || '')) {
        return chunkTypescriptCode(sourceCode, fileName);
    } else {
       
        return chunkArbitraryFile(sourceCode, 50);
    }
};