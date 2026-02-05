import { AlertTriangle, X } from "lucide-react";
import { useState, useEffect } from "react";

export const ServerAlertBanner = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if the user has already dismissed the alert in this session
        const hasSeenAlert = sessionStorage.getItem("hasSeenServerAlert");
        if (!hasSeenAlert) {
            setIsVisible(true);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        // Save flag to session storage so it doesn't reappear until tab is closed
        sessionStorage.setItem("hasSeenServerAlert", "true");
    };

    if (!isVisible) return null;

    return (
        <div className="fixed top-0 left-0 w-full z-[100] bg-amber-900/90 border-b border-amber-500/20 backdrop-blur-md shadow-lg">
            <div className="container mx-auto max-w-7xl px-4 py-3 flex items-start md:items-center gap-3 text-amber-200/90 text-sm">

                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5 md:mt-0" />

                <div className="flex-1">
                    <span className="font-semibold text-amber-400">A Message from the Dev:</span>
                    {" "}Server runs on free infrastructure. If unresponsive, click
                    <span className="inline-block mx-1.5 px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs text-white font-bold align-middle">
                        ● Server Status
                    </span>
                    in the footer to wake it up, It might take a minute or two.
                </div>

                <button
                    onClick={handleDismiss}
                    className="p-1 hover:bg-amber-500/20 text-amber-500 rounded-full transition-colors shrink-0"
                    aria-label="Dismiss alert"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};