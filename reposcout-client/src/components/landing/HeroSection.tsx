import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Github, ArrowRight } from 'lucide-react';
import { ScrambleText } from '@/components/landing/ScrambleText';
import { MagneticButton } from '@/components/landing/MagneticButton';
import { useAppStore } from '@/store/useAppStore';

export const HeroSection = () => {
    const navigate = useNavigate();
    const [repoUrl, setRepoUrl] = useState('');
    const [isFocused, setIsFocused] = useState(false);


    const currentUser = useAppStore((state) => state.currentUser);

    const [wordIndex, setWordIndex] = useState(0);
    const words = ["Understanding", "Visualizing", "Engineering", "Analysing"];

    useEffect(() => {
        const interval = setInterval(() => {
            setWordIndex((prev) => (prev + 1) % words.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleAnalyze = () => {

        if (!repoUrl.trim()) return;

        if (currentUser) {
            navigate('/dashboard', { state: { prefillUrl: repoUrl } });
        } else {
            navigate('/auth');
        }
    };

    return (
        <section className="w-full flex flex-col items-center text-center space-y-10 mb-24 pt-20 relative z-20">

            <h1 className="text-5xl md:text-8xl font-black tracking-tight text-white max-w-7xl mx-auto leading-[1.1]">
                <span className="block mb-6 drop-shadow-2xl">
                    <span className="text-white">Source</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Seek</span>
                </span>


                <span className="block text-white drop-shadow-2xl">
                    Stop Browsing.
                </span>


                <span className="block">
                    Start{" "}
                    <span className="text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.4)]">
                        <ScrambleText text={words[wordIndex]} className="inline-block" />
                    </span>
                    <span className="text-cyan-400">.</span>
                </span>
            </h1>


            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed px-4 font-light"
            >
                Transform static GitHub repositories into interactive, visual knowledge bases. Navigate complex codebases with the speed of thought.
            </motion.p>


            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="relative w-full max-w-xl px-4 group"
            >

                <div
                    className={`absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-tilt ${isFocused ? 'opacity-80 blur-md' : ''}`}
                ></div>

                <div className="relative bg-[#0a0f1e] rounded-xl flex items-center p-2 border border-slate-700/50 shadow-2xl">
                    <div className="pl-4 text-slate-400">
                        <Github size={24} />
                    </div>
                    <input
                        type="text"
                        placeholder="https://github.com/username/repository"
                        className="w-full bg-transparent text-white px-4 py-4 outline-none placeholder:text-slate-600 font-mono text-sm md:text-base"
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                    />
                    <MagneticButton
                        onClick={handleAnalyze}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-lg transition-colors shadow-[0_0_15px_rgba(6,182,212,0.6)] flex items-center justify-center"
                    >
                        <ArrowRight size={24} />
                    </MagneticButton>
                </div>
            </motion.div>
        </section>
    );
};