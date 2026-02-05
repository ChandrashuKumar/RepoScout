import { useNavigate, useLocation, matchPath } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { ExternalLink, LogOut } from "lucide-react"; 
import { Logo } from "@/components/Logo";

export const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const currentUser = useAppStore((state) => state.currentUser);
    const logout = useAppStore((state) => state.logout);
    const savedRepos = useAppStore((state) => state.savedRepos);

    const match = matchPath("/repo/:id", location.pathname);
    const currentRepoId = match?.params.id;

    const activeRepo = currentRepoId
        ? savedRepos.find((r) => r.id === currentRepoId)
        : null;

    const handleNavigation = () => {
        if (currentUser) {
            navigate("/dashboard");
        } else {
            navigate("/auth");
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <header className="fixed top-0 left-0 w-full z-50 bg-[#020617]/80 backdrop-blur-md border-b border-slate-800/50">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">

                
                <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => navigate('/')}
                >
                    <Logo className="h-8 w-8 transition-transform group-hover:scale-105" />

                    <span className="text-xl font-bold tracking-tight">
                        <span className="text-white">Repo</span>
                        <span className="text-cyan-400">Scout</span>
                    </span>
                </div>

                
                <div className="flex items-center gap-4">

                    {activeRepo && (
                        <Button
                            variant="ghost"
                            className="hidden sm:flex text-slate-400 hover:text-white hover:bg-white/5 gap-2"
                            onClick={() => window.open(activeRepo.url, '_blank')}
                        >
                            <ExternalLink className="h-4 w-4" />
                            View on GitHub
                        </Button>
                    )}

                    
                    {currentUser && (
                        <Button
                            variant="ghost"
                            className="text-slate-400 hover:text-red-400 hover:bg-red-950/20 gap-2"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="hidden sm:inline">Sign Out</span>
                        </Button>
                    )}

                    <Button
                        className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-[0_0_15px_rgba(6,182,212,0.4)] border-none"
                        onClick={handleNavigation}
                    >
                        {currentUser ? "Dashboard" : "Get Started"}
                    </Button>
                </div>
            </nav>
        </header>
    );
};