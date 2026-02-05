import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Cpu } from 'lucide-react';

interface TiltCardProps {
    title: string;
    description: string;
    icon: React.ElementType;
    delay: number;
}

export const TiltCard = ({ title, description, icon: Icon, delay }: TiltCardProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
    const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["7deg", "-7deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-7deg", "7deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseXFromCenter = e.clientX - rect.left - width / 2;
        const mouseYFromCenter = e.clientY - rect.top - height / 2;
        x.set(mouseXFromCenter / width);
        y.set(mouseYFromCenter / height);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: delay * 0.1 }}
            className="relative h-64 w-full rounded-2xl bg-slate-900/40 border border-slate-700/50 backdrop-blur-md p-6 flex flex-col items-start justify-between group overflow-hidden"
        >
        
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="relative z-10 p-3 bg-slate-800/50 rounded-lg border border-slate-700 text-cyan-400 mb-4 group-hover:text-cyan-300 transition-colors">
                <Icon size={24} />
            </div>

            <div className="relative z-10">
                <h3 className="text-xl font-bold text-slate-100 mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
            </div>

         
            <div className="absolute top-0 right-0 p-3 opacity-20">
                <Cpu size={40} strokeWidth={1} />
            </div>
        </motion.div>
    );
};