import { useState } from 'react';
import { Github, Twitter, Linkedin, Activity, Power, Loader2 } from 'lucide-react';
import { systemApi } from '@/services/api';

export const Footer = () => {
    const [serverStatus, setServerStatus] = useState<'unknown' | 'waking' | 'active'>('unknown');

    const handleCheckStatus = async () => {
        if (serverStatus === 'active') return;

        const slowResponseTimer = setTimeout(() => {

            setServerStatus('waking');
        }, 2000);

        try {

            await systemApi.checkHealth();

            // 3. Success!
            clearTimeout(slowResponseTimer);
            setServerStatus('active');

        } catch (error) {
            clearTimeout(slowResponseTimer);
            console.error("Wake-up failed", error);

            setServerStatus('unknown');
        }
    };

    return (
        <footer className="border-t border-slate-800 bg-slate-950 py-12 mt-20 relative z-10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">


                <div className="flex justify-center mb-12">
                    <button
                        onClick={handleCheckStatus}
                        disabled={serverStatus === 'active' || serverStatus === 'waking'}
                        className={`
                            group relative flex items-center gap-3 px-5 py-2.5 rounded-full border transition-all duration-300
                            ${serverStatus === 'active'
                                ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-400 cursor-default'
                                : serverStatus === 'waking'
                                    ? 'bg-amber-950/30 border-amber-500/50 text-amber-400 cursor-wait'
                                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-cyan-500 hover:text-cyan-400'
                            }
                        `}
                    >

                        <div className="relative flex h-3 w-3">
                            {serverStatus === 'active' && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            )}
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${serverStatus === 'active' ? 'bg-emerald-500' :
                                serverStatus === 'waking' ? 'bg-amber-500 animate-pulse' : 'bg-slate-600'
                                }`}></span>
                        </div>


                        <span className="font-mono text-sm font-medium">
                            {serverStatus === 'active' && "System Online"}
                            {serverStatus === 'waking' && "Waking Server (~50s)..."}
                            {serverStatus === 'unknown' && "Server Status: Unknown (Click to Check)"}
                        </span>


                        {serverStatus === 'waking' && (
                            <Loader2 className="animate-spin h-4 w-4 text-amber-500" />
                        )}


                        {serverStatus === 'unknown' && (
                            <Power className="h-4 w-4 group-hover:text-cyan-400 transition-colors" />
                        )}
                    </button>
                </div>


                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4 text-cyan-400">
                            <Activity className="h-6 w-6" />
                            <span className="text-xl font-bold tracking-tight text-white">RepoScout</span>
                        </div>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Chat with your codebase. <br />
                            Understand complex logic instantly.
                        </p>
                    </div>



                </div>
                <div className="mt-12 py-8 border-t border-slate-800/50">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">

                        <div className="max-w-2xl text-center md:text-left space-y-2">
                            <p>
                                <span className="font-semibold text-slate-400">Project Disclaimer:</span> This is a portfolio project demonstrating RAG (Retrieval-Augmented Generation) & Graph Algorithms.
                            </p>
                            <p>
                                Deployed on <span className="text-slate-400">Render Free Tier</span>.
                                The server sleeps after 15 minutes of inactivity, which may cause a
                                <span className="text-slate-400"> 1-2 minute delay </span>
                                on the initial request. Data persistence is not guaranteed. Thank you for your understanding.
                            </p>
                        </div>

                        <div className="text-slate-600">
                            v1.0.0 • © 2025 RepoScout
                        </div>
                    </div>
                </div>
                <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-600 text-sm">
                        © {new Date().getFullYear()} RepoScout. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <a href="https://github.com/AdityaAryan-1408" className="text-slate-500 hover:text-white transition-colors"><Github className="h-5 w-5" /></a>
                        <a href="https://x.com/AdityaAryan1408" className="text-slate-500 hover:text-white transition-colors"><Twitter className="h-5 w-5" /></a>
                        <a href="https://www.linkedin.com/in/aditya-aryan-7211b3241/" className="text-slate-500 hover:text-white transition-colors"><Linkedin className="h-5 w-5" /></a>
                    </div>
                </div>
            </div>
        </footer>
    );
};