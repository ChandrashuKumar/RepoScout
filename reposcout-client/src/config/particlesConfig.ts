import type { IOptions } from "@tsparticles/engine";


export const particlesConfig: IOptions = {
    // 1. fullScreen
    fullScreen: {
        enable: true,
        zIndex: -1,
    },

    // 2. background
    background: {
        color: {
            value: "#0a0a0a",
        },
        image: "",
        position: "50% 50%",
        repeat: "no-repeat",
        size: "cover",
        opacity: 1,
    },

    particles: {
        // 3. number
        number: {
            value: 250,
            density: {
                enable: true,
                area: 800,
                factor: 1000,
            },
        },

        // 4. color
        color: {
            value: "#ffffff",
            animation: {
                enable: false,
                speed: 1,
                sync: true,
            },
        },

        // 5. shape
        shape: {
            type: "circle",
            close: true,
            fill: true,
            options: {},
        },

        // 6. opacity
        opacity: {
            value: {
                min: 0.1,
                max: 0.5,
            },
            animation: {
                enable: false,
                speed: 1,
                sync: false,
                destroy: "none",
                startValue: "random",
            },
        },

        // 7. size
        size: {
            value: {
                min: 1,
                max: 3,
            },
            animation: {
                enable: true,
                speed: 40,
                sync: false,
                destroy: "none",
                startValue: "random",
            },
        },

        // 8. links
        links: {
            enable: false,
        },

        // 9. move
        move: {
            enable: true,
            speed: {
                min: 0.5,
                max: 1.5,
            },
            direction: "top",
            random: false,
            straight: true,
            // FIX 1: 'outMode' is now 'outModes' (plural)
            outModes: "out",
            bounce: false,
            warp: true
        },
    },

    // 10. interactivity
    interactivity: {
        events: {
            onHover: {
                enable: false,
                // FIX 2: Add missing 'mode' and 'parallax' properties
                mode: "grab",
                parallax: {
                    enable: false,
                    force: 2,
                    smooth: 10,
                },
            },
            onClick: {
                enable: false,
                // FIX 3: Add missing 'mode' property
                mode: "push",
            },
        },
    },

    // 11. detectRetina
    detectRetina: true,
} as any;