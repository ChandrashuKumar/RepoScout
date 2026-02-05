import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useChatStore } from "@/store/useChatStore";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, Code2, ChevronRight, Loader2, FileText, Sparkles, Download } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

interface ChatPanelProps {
    repoId: string;
}

export default function ChatPanel({ repoId }: ChatPanelProps) {
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Chat store (sessionStorage)
    const chatHistory = useChatStore((state) => state.chatHistory);
    const hasHydrated = useChatStore((state) => state.hasHydrated);

    // App store
    const askQuestion = useAppStore((state) => state.askQuestion);
    const isLoading = useAppStore((state) => state.isLoading);
    const setSelectedNodeId = useAppStore((state) => state.setSelectedNodeId);
    const setCurrentHighlight = useAppStore((state) => state.setCurrentHighlight);
    const selectedLlm = useAppStore((state) => state.selectedLlm);
    const setSelectedLlm = useAppStore((state) => state.setSelectedLlm);
    const reactFlowInstance = useAppStore((state) => state.reactFlowInstance);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [chatHistory, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        const question = input;
        setInput("");
        await askQuestion(repoId, question);
    };

    const handleSourceClick = (source: { filePath: string; startLine: number; endLine: number }) => {
        const nodeId = source.filePath.replace(/\\/g, '/');

        // Set both the selected node and the highlight
        setSelectedNodeId(nodeId);
        setCurrentHighlight({
            startLine: source.startLine,
            endLine: source.endLine
        });

        // Zoom to the node
        if (reactFlowInstance) {
            const node = reactFlowInstance.getNode(nodeId);
            if (node) {
                reactFlowInstance.fitView({ nodes: [node], duration: 500, padding: 0.2 });
            }
        }
    };

    const handleExportChat = () => {
        if (chatHistory.length === 0) return;

        const markdown = chatHistory.map((msg) => {
            const sender = msg.sender === 'user' ? '**You**' : '**Assistant**';
            let content = `${sender}:\n${msg.message}`;

            if (msg.sources && msg.sources.length > 0) {
                content += '\n\n*References:*\n';
                msg.sources.forEach((source) => {
                    content += `- \`${source.filePath}\` (Lines ${source.startLine}-${source.endLine})\n`;
                });
            }

            return content;
        }).join('\n\n---\n\n');

        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-export-${new Date().toISOString().slice(0, 10)}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#0a0f1e] border-r border-slate-700/50 relative z-20">
           
            <div className="p-4 border-b border-slate-700/50 bg-[#0a0f1e]/95 backdrop-blur-md flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-cyan-500 blur-sm opacity-20 rounded-lg"></div>
                        <div className="relative p-1 bg-slate-900 border border-slate-700 rounded-lg text-cyan-400">
                            <Logo className="h-6 w-6" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-white font-medium text-sm tracking-wide">Repo Assistant</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <p className="text-[10px] text-slate-400 font-mono">ONLINE</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <ButtonGroup className="border border-slate-700 rounded-lg overflow-hidden">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLlm('gemini')}
                            className={`rounded-none border-0 px-3 py-1.5 text-xs font-medium transition-all ${
                                selectedLlm === 'gemini'
                                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            }`}
                        >
                            Gemini
                        </Button>
                        <div className="w-px bg-slate-700" />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLlm('groq')}
                            className={`rounded-none border-0 px-3 py-1.5 text-xs font-medium transition-all ${
                                selectedLlm === 'groq'
                                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            }`}
                        >
                            Groq
                        </Button>
                    </ButtonGroup>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleExportChat}
                        disabled={chatHistory.length === 0}
                        className="h-8 w-8 bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Export chat"
                    >
                        <Download size={14} />
                    </Button>
                </div>
            </div>

            
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent" ref={scrollRef}>

                
                {hasHydrated && chatHistory.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 opacity-60">
                        <Sparkles size={32} className="text-cyan-500/50" />
                        <p className="text-sm font-medium text-slate-300">Ask me anything about the code</p>
                    </div>
                )}

                {hasHydrated && (
                    <AnimatePresence mode="popLayout">
                        {chatHistory.map((msg) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                key={msg.id}
                                layout
                                className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border shadow-lg ${msg.sender === 'user'
                                ? 'bg-blue-600/20 border-blue-500/30 text-blue-400'
                                : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                                }`}>
                                {msg.sender === 'user' ? <User size={14} /> : <Logo className="h-4 w-4" />}
                            </div>

                            <div className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-sm'
                                    : 'bg-[#111827] border border-slate-700/50 text-slate-300 rounded-tl-sm'
                                    }`}>
                                    <ReactMarkdown
                                        components={{
                                            code: ({ node, ...props }) => <span className="bg-slate-900/80 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs border border-slate-700/50" {...props} />
                                        }}
                                    >
                                        {msg.message}
                                    </ReactMarkdown>
                                </div>

                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-2 w-full space-y-1">
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-1">
                                            <FileText size={10} />
                                            <span>References</span>
                                        </div>
                                        {msg.sources.map((source, sIdx) => (
                                            <button
                                                key={sIdx}
                                                onClick={() => handleSourceClick(source)}
                                                className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/40 border border-slate-800/60 hover:border-cyan-500/30 hover:bg-cyan-950/30 transition-all w-full text-left group"
                                            >
                                                <Code2 size={12} className="text-slate-500 group-hover:text-cyan-400" />
                                                <div className="flex flex-col overflow-hidden flex-1">
                                                    <span className="text-xs text-slate-300 font-medium truncate group-hover:text-cyan-200">
                                                        {source.filePath.split('/').pop()}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 truncate font-mono">
                                                        Lines {source.startLine}-{source.endLine}
                                                    </span>
                                                </div>
                                                <ChevronRight size={12} className="text-slate-600 group-hover:text-cyan-400" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                            </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}

                {isLoading && (
                    <div className="flex gap-4">
                        <Loader2 className="animate-spin text-cyan-400" size={14} />
                        <span className="text-xs text-slate-500 animate-pulse">Thinking...</span>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-700/50 bg-[#0a0f1e] shrink-0">
                <div className="relative flex items-center bg-[#0a0f1e] rounded-xl border border-slate-700/50 shadow-xl">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about this repo..."
                        className="w-full bg-transparent text-white px-4 py-3.5 outline-none font-mono text-sm"
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} disabled={isLoading || !input.trim()} className="p-2 mr-2 text-slate-400 hover:text-cyan-400">
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}