import { useEffect, useState, memo } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { particlesConfig } from "@/config/particlesConfig";

const ParticleBackground = memo(() => {
    const [init, setInit] = useState(false);

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    if (init) {
        return (
            <Particles
                id="tsparticles-global"
                options={particlesConfig as any}
                className="fixed inset-0 z-0"
            />
        );
    }

    return null;
});

// Display name for debugging
ParticleBackground.displayName = "ParticleBackground";

export default ParticleBackground;