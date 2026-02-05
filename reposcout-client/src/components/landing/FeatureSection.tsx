import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FeatureSectionProps {
    title: string;
    description: string;
    reverse?: boolean;
    videoSrc?: string;
}

export const FeatureSection = ({
    title,
    description,
    reverse = false,
    videoSrc,
}: FeatureSectionProps) => {

    const variants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <motion.section
            className="container mx-auto px-4 sm:px-6 lg:px-8 py-24"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            variants={variants}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* Text Content */}
                <div className={cn("flex flex-col gap-6", reverse && "lg:order-last")}>
                    <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                        {title}
                    </h2>
                    <p className="text-lg text-slate-400 leading-relaxed">
                        {description}
                    </p>
                </div>

                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

                    <div className="relative rounded-2xl overflow-hidden border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm shadow-2xl">
                        {videoSrc ? (
                            <video
                                className="w-full h-full object-cover"
                                autoPlay
                                loop
                                muted
                                playsInline
                                src={videoSrc}
                            />
                        ) : (

                            <div className="aspect-video bg-slate-950 flex items-center justify-center border-slate-800">
                                <p className="text-slate-500 text-sm font-mono">Add {`"${title}"`} video to public folder</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.section>
    );
};