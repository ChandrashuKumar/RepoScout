import { motion } from 'framer-motion';
import { Terminal, GitBranch, Zap, Search, Sparkles, Globe, ArrowUpRight, Link2, MessageSquareCode, Network } from 'lucide-react';
import { ParticleNetwork } from '@/components/landing/ParticleNetwork';
import { HeroSection } from '@/components/landing/HeroSection';
import { Footer } from '@/components/landing/Footer';
import { cn } from "@/lib/utils";

const BentoItem = ({ title, description, icon: Icon, className, delay }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: delay * 0.1, duration: 0.5 }}
        className={cn(
            "group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40 p-8 hover:bg-slate-900/60 transition-colors duration-500",
            className
        )}
    >
        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight className="text-cyan-500" />
        </div>

        <div className="relative z-10 flex flex-col h-full justify-between gap-8">
            <div className="p-3 w-fit rounded-2xl bg-slate-800/50 border border-slate-700/50 text-cyan-400 group-hover:text-cyan-300 group-hover:scale-110 transition-all duration-300">
                <Icon size={28} />
            </div>
            <div>
                <h3 className="text-xl font-bold text-slate-100 mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
            </div>
        </div>

        {/* Hover Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
);

export default function IntroPage() {

    const noiseFilter = (
        <svg className="fixed inset-0 z-[1] opacity-[0.03] pointer-events-none w-full h-full">
            <filter id="noiseFilter">
                <feTurbulence type="fractalNoise" baseFrequency="0.6" stitchTiles="stitch" />
            </filter>
            <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
    );

    return (
        <div className="relative min-h-screen bg-[#020617] text-slate-200 overflow-x-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200">

            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,#0f172a,rgba(2,6,23,1))] pointer-events-none z-0" />
            <ParticleNetwork />
            {noiseFilter}

            <main className="relative z-10 flex flex-col items-center w-full max-w-7xl mx-auto pt-20">

                <HeroSection />

                <section className="w-full pb-32 px-4">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                        <motion.h2
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="text-3xl font-bold text-white"
                        >
                            Capabilities
                        </motion.h2>
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="h-[1px] bg-slate-800 flex-grow mx-6 mb-2 hidden md:block"
                        />
                        <motion.span
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="text-slate-500 font-mono text-sm hidden md:block"
                        >
                            // SYSTEMS
                        </motion.span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        <BentoItem
                            title="Repository Ingestion"
                            description="Paste any GitHub URL to automatically clone, parse, and index the entire codebase on the server."
                            icon={Terminal}
                            className="md:col-span-2"
                            delay={1}
                        />
                        <BentoItem
                            title="Smart Chunking"
                            description="TypeScript AST-based parsing that splits code into functions, classes, and modules for precise retrieval."
                            icon={Zap}
                            className="md:col-span-1"
                            delay={2}
                        />


                        <BentoItem
                            title="Semantic Search"
                            description="Find relevant code using vector embeddings and RAG rather than simple string matching."
                            icon={Search}
                            className="md:col-span-1"
                            delay={3}
                        />
                        <BentoItem
                            title="Graph Visualization"
                            description="Explore your repository's file structure as an interactive node graph with syntax-highlighted code previews."
                            icon={GitBranch}
                            className="md:col-span-2"
                            delay={4}
                        />


                        <BentoItem
                            title="Multi-LLM Chat"
                            description="Switch between multiple LLM models on the fly to chat with your codebase."
                            icon={Sparkles}
                            className="md:col-span-1"
                            delay={5}
                        />
                        <BentoItem
                            title="Dependency Map"
                            description="Visualize file relationships and internal dependencies to understand the architecture of any project."
                            icon={Globe}
                            className="md:col-span-2"
                            delay={6}
                        />
                    </div>
                </section>

                <section className="w-full pb-32 px-4">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16">
                        <motion.h2
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="text-3xl font-bold text-white"
                        >
                            How It Works
                        </motion.h2>
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="h-[1px] bg-slate-800 flex-grow mx-6 mb-2 hidden md:block"
                        />
                        <motion.span
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="text-slate-500 font-mono text-sm hidden md:block"
                        >
                            // WORKFLOW
                        </motion.span>
                    </div>

                    <div className="relative">
                        {/* Connecting line */}
                        <div className="absolute left-6 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 via-slate-700/50 to-transparent hidden sm:block" />

                        <div className="space-y-16 md:space-y-24">
                            {[
                                {
                                    step: '01',
                                    title: 'Paste a GitHub URL',
                                    description: 'Drop any public repository link. RepoScout clones, parses, and indexes the entire codebase on the server with real-time progress tracking.',
                                    icon: Link2,
                                    code: 'https://github.com/user/repo',
                                },
                                {
                                    step: '02',
                                    title: 'Explore the Graph',
                                    description: 'Browse your repository as an interactive node graph. Click any file to view syntax-highlighted source code with line numbers.',
                                    icon: Network,
                                    code: 'src/  components/  utils/  index.ts',
                                },
                                {
                                    step: '03',
                                    title: 'Chat with Your Code',
                                    description: 'Ask questions in plain English. Get contextual answers powered by RAG with direct references to the relevant source files.',
                                    icon: MessageSquareCode,
                                    code: '"How does authentication work?"',
                                },
                            ].map((item, idx) => (
                                <motion.div
                                    key={item.step}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                                    className={cn(
                                        "relative grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center",
                                        idx % 2 !== 0 && "md:direction-rtl"
                                    )}
                                >
                                    {/* Step indicator on the line */}
                                    <div className="absolute left-6 md:left-1/2 -translate-x-1/2 top-0 z-10 hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-slate-900 border-2 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                                        <span className="text-cyan-400 font-mono text-sm font-bold">{item.step}</span>
                                    </div>

                                    {/* Text side */}
                                    <div className={cn(
                                        "pl-16 sm:pl-20 md:pl-0",
                                        idx % 2 === 0 ? "md:text-right md:pr-16" : "md:order-last md:pl-16"
                                    )}>
                                        <div className={cn(
                                            "flex items-center gap-3 mb-3",
                                            idx % 2 === 0 ? "md:justify-end" : "md:justify-start"
                                        )}>
                                            <span className="text-cyan-400 font-mono text-sm font-bold sm:hidden">{item.step}</span>
                                            <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-cyan-400">
                                                <item.icon size={20} />
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                                        <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
                                    </div>

                                    {/* Visual side */}
                                    <div className={cn(
                                        "pl-16 sm:pl-20 md:pl-0",
                                        idx % 2 === 0 ? "md:pl-16" : "md:pr-16"
                                    )}>
                                        <div className="relative group">
                                            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                                            <div className="relative rounded-2xl border border-slate-800 bg-slate-950/80 p-6 font-mono text-sm">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                                                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                                                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                                                </div>
                                                <div className="text-slate-500">
                                                    <span className="text-slate-600">{'>'} </span>
                                                    <span className="text-cyan-400">{item.code}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="w-full px-4">
                    <Footer />
                </div>

            </main>
        </div>
    );
}