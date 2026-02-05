import { useState, useEffect } from "react";
import { useAppStore } from '@/store/useAppStore';
import { repoApi } from '@/services/api';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileCode, Copy, Check, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

export const CodeViewer = () => {
    const selectedNodeId = useAppStore((state) => state.selectedNodeId);
    const currentHighlight = useAppStore((state) => state.currentHighlight);
    const reactFlowInstance = useAppStore((state) => state.reactFlowInstance);

    const [code, setCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCode = async () => {
            if (!selectedNodeId || !reactFlowInstance) return;

            const node = reactFlowInstance.getNode(selectedNodeId);
            const dbId = node?.data?.dbId;

            if (!dbId) {
                
                setCode(null);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const data = await repoApi.getFileContent(dbId);
                setCode(data.content);
            } catch (err) {
                console.error("Failed to load code:", err);
                setError("Failed to load file content.");
                setCode(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCode();
    }, [selectedNodeId, reactFlowInstance]);

    const fileName = selectedNodeId ? selectedNodeId.split('/').pop() : "";
    const language = fileName?.split('.').pop() === 'ts' || fileName?.split('.').pop() === 'tsx' ? 'typescript' : 'javascript';
    const filePath = selectedNodeId || "";

    const handleCopy = () => {
        if (code) {
            navigator.clipboard.writeText(code);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    if (!selectedNodeId) {
        return (
            <div className="h-full w-full bg-gray-900/50 flex flex-col items-center justify-center text-gray-500">
                <div className="bg-gray-800/50 p-4 rounded-full mb-4">
                    <FileCode className="h-12 w-12 opacity-50" />
                </div>
                <p className="text-lg font-medium">No File Selected</p>
                <p className="text-sm mt-2 max-w-xs text-center opacity-70">
                    Select a file from the graph to view its source code.
                </p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="h-full w-full bg-gray-950 flex flex-col items-center justify-center text-cyan-500">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p className="text-sm">Fetching code...</p>
            </div>
        );
    }

    if (error || !code) {
        return (
            <div className="h-full w-full bg-gray-950 flex flex-col items-center justify-center text-red-400">
                <p>{error || "Could not load content for this node."}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full bg-gray-950 border-l border-gray-800">

            
            <div className="h-12 flex items-center justify-between px-4 bg-gray-900 border-b border-gray-800">
                <div className="flex items-center text-sm text-gray-400 overflow-hidden whitespace-nowrap">
                    <FileCode className="h-4 w-4 mr-2 text-blue-400" />
                    <span className="opacity-50 mr-1 truncate max-w-[100px]">{filePath.split('/').slice(0, -1).join('/')}</span>
                    {filePath.includes('/') && <ChevronRight className="h-3 w-3 mx-1 opacity-30" />}
                    <span className="font-medium text-gray-200 truncate">
                        {fileName}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400 border border-gray-700 uppercase">
                        {language}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                        onClick={handleCopy}
                    >
                        {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

           
            <div className="flex-1 overflow-hidden relative">
                <ScrollArea className="h-full w-full">
                    <SyntaxHighlighter
                        language={language}
                        style={atomDark}
                        showLineNumbers={true}
                        wrapLines={false}
                        className="h-full w-full text-sm !bg-transparent"
                        codeTagProps={{
                            style: { fontFamily: '"Fira Code", "JetBrains Mono", monospace' }
                        }}
                        customStyle={{ background: 'transparent', margin: 0, padding: '1.5rem' }}
                        lineProps={(lineNumber) => {
                            const style: React.CSSProperties = { display: 'block' };

                           
                            if (
                                currentHighlight &&
                                lineNumber >= currentHighlight.startLine &&
                                lineNumber <= currentHighlight.endLine
                            ) {
                                style.backgroundColor = 'rgba(6, 182, 212, 0.15)'; // Cyan tint
                                style.borderLeft = '4px solid #06b6d4'; // Cyan border
                                style.background = 'linear-gradient(90deg, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0) 100%)';
                                style.width = "100%";
                            }
                            return { style };
                        }}
                    >
                        {code}
                    </SyntaxHighlighter>
                </ScrollArea>
            </div>
        </div>
    );
};