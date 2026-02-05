import { motion } from 'framer-motion';
import { Terminal, GitBranch, Zap, Search, Code, Globe, ArrowUpRight } from 'lucide-react';
import { ParticleNetwork } from '@/components/landing/ParticleNetwork';
import { HeroSection } from '@/components/landing/HeroSection';
import { Footer } from '@/components/landing/Footer';
import { FeatureSection } from '@/components/landing/FeatureSection';
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
                            title="Static Analysis"
                            description="Deep dive into code structures without cloning locally. Syntax highlighting and dependency graphing in real-time."
                            icon={Terminal}
                            className="md:col-span-2"
                            delay={1}
                        />
                        <BentoItem
                            title="Instant Parse"
                            description="Powered by Rust-based WASM modules for lightning-fast parsing."
                            icon={Zap}
                            className="md:col-span-1"
                            delay={2}
                        />

                       
                        <BentoItem
                            title="Semantic Search"
                            description="Find functions, definitions, and references using vector embeddings rather than simple string matching."
                            icon={Search}
                            className="md:col-span-1"
                            delay={3}
                        />
                        <BentoItem
                            title="Tree Visualization"
                            description="Interactive file system explorer using WebGL. Navigate complex folder structures as a 3D node constellation."
                            icon={GitBranch}
                            className="md:col-span-2"
                            delay={4}
                        />

                        
                        <BentoItem
                            title="Code Metrics"
                            description="Cyclomatic complexity, maintainability index, and line counts visualized instantly upon repository load."
                            icon={Code}
                            className="md:col-span-1"
                            delay={5}
                        />
                        <BentoItem
                            title="Dependency Map"
                            description="Visualizing external and internal dependencies to understand the architectural footprint of any project."
                            icon={Globe}
                            className="md:col-span-2"
                            delay={6}
                        />
                    </div>
                </section>

                <section className="w-full pb-32 px-4">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12">
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

                    <div className="space-y-32">
                        <FeatureSection
                            title="Analyze any repository"
                            description="Just paste a link to any public GitHub repository. RepoScout will clone, parse, and index the entire codebase, building a smart graph of its structure."
                            videoSrc="/videos/demo-analyze.mp4"
                        />

                        <FeatureSection
                            title="Chat with your code"
                            description="Ask questions in plain English, like 'How is user authentication handled?' or 'Explain the useAnalytics hook'. Get instant answers and see the relevant code."
                            reverse={true}
                            videoSrc="/videos/demo-chat.mp4"
                        />

                        <FeatureSection
                            title="Streamline your workflow"
                            description="Automate code reviews, onboard new team members faster, and quickly get up to speed on unfamiliar projects with AI-powered insights."
                            videoSrc="/videos/demo-workflow.mp4"
                        />
                    </div>
                </section>

                <div className="w-full px-4">
                    <Footer />
                </div>

            </main>
        </div>
    );
}