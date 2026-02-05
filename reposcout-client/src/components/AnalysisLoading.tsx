import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Terminal, 
    Minimize2, 
    Timer, 
    ChevronDown, 
    ChevronUp
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from "@/components/ui/button";

interface AnalysisLoadingProps {
    onBackground: () => void;
    repoId: string;
}

interface LogMessage {
    message: string;
    progress: number;
    eta: string | null;
    timestamp: string;
}

export const AnalysisLoading = ({ onBackground, repoId }: AnalysisLoadingProps) => {
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState("Initializing connection...");
    const [eta, setEta] = useState<string | null>(null);
    const [logs, setLogs] = useState<LogMessage[]>([]);
    const [showTerminal, setShowTerminal] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, showTerminal]);

    useEffect(() => {
        let active = true;
        const token = localStorage.getItem("token"); 
        const controller = new AbortController();

        const connectToStream = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ingest/${repoId}/progress`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    signal: controller.signal
                });

                if (!response.ok || !response.body) {
                    throw new Error("Failed to connect to stream");
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                
                while (active) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split("\n\n");

                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            try {
                                const data: LogMessage = JSON.parse(line.replace("data: ", ""));
                                
                                setProgress(data.progress);
                                setStatusMessage(data.message);
                                if (data.eta) setEta(data.eta);
                                
                                setLogs(prev => [...prev, data]);

                                if (data.progress === 100) {
                                    setIsComplete(true);
                                }
                            } catch (e) {
                                console.error("Error parsing SSE data", e);
                            }
                        }
                    }
                }
            } catch (error) {
                if (active) {
                    console.error("Stream error:", error);
                    setStatusMessage("Connection lost. Retrying...");
                }
            }
        };

        connectToStream();

        return () => {
            active = false;
            controller.abort();
        };
    }, [repoId]);

    return (
        <div className="fixed inset-0 z-50 bg-[#0a0f1e]/95 backdrop-blur-md flex flex-col items-center justify-center p-4 font-mono">
            
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-2xl"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-scan" />

                <div className="flex flex-col items-center mb-8">
                    <div className="relative mb-4">
                        <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 animate-pulse"></div>
                        <Logo className="w-12 h-12 relative z-10" />
                    </div>
                    <h2 className="text-xl text-white font-bold tracking-wider">
                        {isComplete ? "INGESTION COMPLETE" : "SYSTEM INITIALIZING"}
                    </h2>
                    <p className="text-xs text-cyan-400 mt-1 uppercase">
                        {statusMessage}
                    </p>
                </div>

                <div className="mb-6 relative h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <motion.div 
                        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-cyan-600 to-blue-600"
                        initial={{ width: "0%" }}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: "spring", stiffness: 50 }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                    </motion.div>
                </div>

                <div className="flex justify-between items-center text-sm text-slate-400 mb-6 px-1">
                    <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4 text-cyan-500" />
                        <span>EST: {eta || "Calculating..."}</span>
                    </div>
                    <div className="font-bold text-white">{progress}%</div>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden bg-black/40">
                    <button 
                        onClick={() => setShowTerminal(!showTerminal)}
                        className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 transition-colors text-xs text-slate-400 uppercase tracking-wider"
                    >
                        <div className="flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-cyan-500" />
                            <span>Live Ingestion Logs</span>
                        </div>
                        {showTerminal ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    <AnimatePresence>
                        {showTerminal && (
                            <motion.div 
                                initial={{ height: 0 }}
                                animate={{ height: "auto" }}
                                exit={{ height: 0 }}
                                className="overflow-hidden"
                            >
                                <div 
                                    ref={scrollRef}
                                    className="h-48 overflow-y-auto p-4 space-y-2 font-mono text-xs border-t border-slate-800"
                                >
                                    {logs.length === 0 && (
                                        <span className="text-slate-600 italic">Waiting for stream...</span>
                                    )}
                                    {logs.map((log, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                                            <span className={
                                                log.message.toLowerCase().includes('error') ? "text-red-400" :
                                                log.message.toLowerCase().includes('complete') ? "text-emerald-400" :
                                                "text-cyan-200/80"
                                            }>
                                                {log.message}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="mt-6 flex justify-center">
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={onBackground}
                        className="text-slate-400 hover:text-white hover:bg-slate-800 gap-2"
                    >
                        <Minimize2 size={16} />
                        Run in Background
                    </Button>
                </div>

            </motion.div>
        </div>
    );
};