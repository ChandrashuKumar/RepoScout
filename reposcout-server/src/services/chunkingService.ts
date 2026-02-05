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
    const processedRanges = new Set<string>();

    const sourceFile = ts.createSourceFile(
        fileName,
        sourceCode,
        ts.ScriptTarget.Latest,
        true
    );

    const addChunk = (node: ts.Node) => {
        const start = node.getStart(sourceFile);
        const end = node.getEnd();
        const rangeKey = `${start}-${end}`;

        // Avoid duplicate chunks (e.g., arrow function already captured via VariableStatement)
        if (processedRanges.has(rangeKey)) return;
        processedRanges.add(rangeKey);

        const startLine = sourceFile.getLineAndCharacterOfPosition(start).line + 1;
        const endLine = sourceFile.getLineAndCharacterOfPosition(end).line + 1;
        const content = sourceCode.substring(start, end);

        chunks.push({ content, startLine, endLine });
    };

    const visit = (node: ts.Node) => {
        // Handle regular functions, classes, and methods directly
        if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) || ts.isMethodDeclaration(node)) {
            addChunk(node);
        }
        // For arrow functions and function expressions, capture the full variable statement
        // e.g., "const double = (x) => x * 2" instead of just "(x) => x * 2"
        else if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
            let parent: ts.Node | undefined = node.parent;

            // Walk up to find VariableStatement (const x = ...) or ExportDeclaration
            while (parent) {
                if (ts.isVariableStatement(parent)) {
                    addChunk(parent);
                    break;
                }
                // Handle: export const fn = () => {}
                if (ts.isExportAssignment(parent)) {
                    addChunk(parent);
                    break;
                }
                // Stop if we hit a block or source file without finding a variable statement
                // This handles cases like arrow functions passed as arguments
                if (ts.isBlock(parent) || ts.isSourceFile(parent)) {
                    addChunk(node);
                    break;
                }
                parent = parent.parent;
            }

            // If no parent found, just add the node itself
            if (!parent) {
                addChunk(node);
            }
        }

        ts.forEachChild(node, visit);
    };

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