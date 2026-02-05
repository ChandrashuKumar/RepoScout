import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CinematicWrapper } from "@/components/CinematicWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";
import { ListOrdered, Trash2, Eye, ArrowRight, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { AnalysisLoading } from "@/components/AnalysisLoading";
import { repoApi } from "@/services/api";

const DashboardPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const currentUser = useAppStore((state) => state.currentUser);
    const savedRepos = useAppStore((state) => state.savedRepos);
    const fetchRepos = useAppStore((state) => state.fetchRepos);
    const deleteRepo = useAppStore((state) => state.deleteRepo);
    const analyzingRepoId = useAppStore((state) => state.analyzingRepoId);
    const setAnalyzingRepoId = useAppStore((state) => state.setAnalyzingRepoId);
    const setAnalysisCurrentStep = useAppStore((state) => state.setAnalysisCurrentStep);

    const [repoUrl, setRepoUrl] = useState("");
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const autoRunRef = useRef(false);

    useEffect(() => {
        if (!currentUser) {
            navigate("/auth");
            return;
        }
        fetchRepos();
    }, [currentUser, navigate, fetchRepos]);

    useEffect(() => {
        if (location.state?.prefillUrl && !autoRunRef.current && !analyzingRepoId) {
            const url = location.state.prefillUrl;

            setRepoUrl(url);

            window.history.replaceState({}, document.title);

            autoRunRef.current = true;

            setTimeout(() => {
                handleAnalyze(url);
            }, 500);
        }
    }, [location.state, analyzingRepoId]);


    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval>;

        if (analyzingRepoId) {
            
            setShowAnalysisModal(true);

            const checkStatus = async () => {
                try {
                    
                    const currentId = analyzingRepoId;

                    
                    const repoStatus = await repoApi.getRepo(currentId);

                    if (repoStatus.status === "COMPLETED") {
                        
                        setNotification({ type: 'success', message: `Analysis complete! Opening graph...` });

                        
                        setAnalyzingRepoId(null);
                        setAnalysisCurrentStep(0);
                        setShowAnalysisModal(false);

                        
                        await fetchRepos();

                       
                        navigate(`/repo/${currentId}`);
                    }
                    else if (repoStatus.status === "FAILED") {
                       
                        setAnalyzingRepoId(null);
                        setAnalysisCurrentStep(0);
                        setShowAnalysisModal(false);
                        setNotification({ type: 'error', message: "Analysis Failed. Please try again." });
                        await fetchRepos();
                    }
                } catch (error) {
                    console.error("Polling error:", error);
                }
            };

           
            intervalId = setInterval(checkStatus, 2000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [analyzingRepoId, setAnalyzingRepoId, fetchRepos, setAnalysisCurrentStep, navigate]);


    const getRepoNameFromUrl = (url: string) => {
        try {
            const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
            const parts = cleanUrl.split('/');
            if (parts.length >= 2) {
                return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
            }
            return cleanUrl;
        } catch (e) {
            return url;
        }
    };

    const handleAnalyze = async (urlToUse?: string) => {
        const targetUrl = urlToUse || repoUrl;

        if (!targetUrl || targetUrl.trim() === "") return;

        const existingRepo = savedRepos.find((r) => r.url === targetUrl.trim());
        if (existingRepo) {
            navigate(`/repo/${existingRepo.id}`);
            return;
        }

        try {
            const repoName = getRepoNameFromUrl(targetUrl);
            setAnalysisCurrentStep(0);

            const data = await repoApi.ingestRepo(targetUrl.trim(), repoName);

            setAnalyzingRepoId(data.id);
            setShowAnalysisModal(true);
            setRepoUrl("");

        } catch (error: any) {
            console.error("Analysis Failed:", error);
            setNotification({ type: 'error', message: error.message || "Failed to start analysis" });
        }
    };

    if (!currentUser) return null;

    return (
        <CinematicWrapper>

            {analyzingRepoId && showAnalysisModal && (
                <AnalysisLoading
                    repoId={analyzingRepoId}
                    onBackground={() => setShowAnalysisModal(false)}
                />
            )}

            {notification && (
                <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg border flex items-center gap-3 animate-in slide-in-from-bottom-5 ${notification.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' : 'bg-red-950/90 border-red-500/50 text-red-200'
                    }`}>
                    {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <p className="font-medium">{notification.message}</p>
                    <button onClick={() => setNotification(null)} className="ml-4 opacity-70 hover:opacity-100">✕</button>
                </div>
            )}

            <div className="pt-32 pb-12 px-4 max-w-5xl mx-auto">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 text-white tracking-tight">
                            Welcome, <span className="text-cyan-400">{currentUser.name || currentUser.email}</span>
                        </h1>
                        <p className="text-slate-400">Manage your analyzed repositories or add a new one.</p>
                    </div>

                    {analyzingRepoId && !showAnalysisModal && (
                        <div className="flex items-center gap-2 bg-cyan-950/50 border border-cyan-500/30 px-4 py-2 rounded-full text-cyan-400 animate-pulse">
                            <Loader2 size={16} className="animate-spin" />
                            <span className="text-sm font-medium">Analyzing in background...</span>
                            <Button variant="link" className="text-cyan-400 p-0 h-auto font-bold ml-2" onClick={() => setShowAnalysisModal(true)}>View</Button>
                        </div>
                    )}
                </div>

                <Card className="w-full border-slate-700/50 bg-slate-900/50 backdrop-blur-md shadow-xl mb-12">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                            Analyze a New Repository
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Paste a GitHub URL to begin the ingestion process.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Input
                                type="text"
                                placeholder="https://github.com/facebook/react"
                                className="bg-slate-950/50 border-slate-700 text-white flex-grow py-6 text-base focus-visible:ring-cyan-500"
                                value={repoUrl}
                                onChange={(e) => setRepoUrl(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                                disabled={!!analyzingRepoId}
                            />
                            <Button
                                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-8 py-6 shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => handleAnalyze()}
                                disabled={!!analyzingRepoId}
                            >
                                {analyzingRepoId ? <Loader2 className="animate-spin" /> : <>Analyze <ArrowRight className="ml-2 h-5 w-5" /></>}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center">
                        <ListOrdered className="h-6 w-6 mr-3 text-cyan-400" />
                        Your Repositories
                    </h2>
                    <span className="text-sm text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                        {savedRepos.length} Projects
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {savedRepos.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                            <p className="text-slate-500">No repositories analyzed yet.</p>
                        </div>
                    ) : (
                        savedRepos.map((repo) => (
                            <div
                                key={repo.id}
                                className="group flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-900/30 border border-slate-800 hover:border-cyan-500/30 hover:bg-slate-900/60 transition-all duration-300"
                            >
                                <div className="flex flex-col items-start gap-1 mb-4 sm:mb-0 w-full sm:w-auto">
                                    <span className="font-semibold text-lg text-slate-200 group-hover:text-cyan-300 transition-colors">
                                        {repo.name}
                                    </span>
                                    <span className="text-xs text-slate-500 font-mono truncate max-w-[250px]">
                                        {repo.url}
                                    </span>
                                </div>

                                <div className="flex gap-3 w-full sm:w-auto">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 sm:flex-none bg-transparent border-slate-700 text-slate-300 hover:border-cyan-500 hover:text-cyan-400 transition-all"
                                        onClick={() => navigate(`/repo/${repo.id}`)}
                                        disabled={repo.status !== 'COMPLETED'}
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        {repo.status === 'COMPLETED' ? 'View' : 'Processing...'}
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex-1 sm:flex-none text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                                        onClick={() => deleteRepo(repo.id)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </CinematicWrapper>
    );
};

export default DashboardPage;