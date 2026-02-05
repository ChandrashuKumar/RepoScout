import type { ReactNode } from 'react'; // <--- FIX: Added 'type' here
import { ParticleNetwork } from '@/components/landing/ParticleNetwork';

interface CinematicWrapperProps {
    children: ReactNode;
    className?: string;
}

export const CinematicWrapper = ({ children, className = "" }: CinematicWrapperProps) => {

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

            <div className={`relative z-10 w-full ${className}`}>
                {children}
            </div>
        </div>
    );
};