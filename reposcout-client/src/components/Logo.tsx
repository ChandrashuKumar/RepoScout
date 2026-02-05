interface LogoProps {
    className?: string;
}

export const Logo = ({ className = "h-8 w-8" }: LogoProps) => {
    return (
        <div
            className={`
        relative flex items-center justify-center 
        rounded-lg bg-gradient-to-br from-blue-600 to-cyan-400 
        shadow-lg shadow-blue-500/20
        ${className}
      `}
        >
            
            <span className="font-mono font-bold text-white text-sm tracking-tighter select-none">
                &gt;_
            </span>
        </div>
    );
};