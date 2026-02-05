import { useState, useEffect, useRef } from "react";
import { CinematicWrapper } from "@/components/CinematicWrapper";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useParams, useNavigate } from "react-router-dom";
import { RepoGraph } from "@/components/RepoGraph";
import { CodeViewer } from "@/components/CodeViewer";
import ChatPanel from "@/components/ChatPanel";
import { Button } from "@/components/ui/button";
import { MessageCircle, Code2, ArrowLeft } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const CollapsedPanelContent = ({ label, onClick }: { label: string, onClick: () => void }) => {
    return (
        <div className="flex items-center justify-center h-full bg-slate-950/50">
            <Button
                variant="ghost"
                onClick={onClick}
                className="h-full w-full flex-col gap-2 text-slate-500 hover:text-cyan-400 transition-colors"
            >
                {label === "Chat" ? <MessageCircle size={18} /> : <Code2 size={18} />}
                <span style={{ writingMode: 'vertical-rl' }} className="text-xs font-bold tracking-widest uppercase">
                    {label}
                </span>
            </Button>
        </div>
    );
};

const RepoPage = () => {
    const [isChatCollapsed, setIsChatCollapsed] = useState(false);
    const [isCodeCollapsed, setIsCodeCollapsed] = useState(false);
    const panelGroupRef = useRef<any>(null);


    const { repoId } = useParams();
    const navigate = useNavigate();


    const fetchRepos = useAppStore(state => state.fetchRepos);
    const savedRepos = useAppStore(state => state.savedRepos);
    const clearChat = useAppStore(state => state.clearChat);


    useEffect(() => {
        
        clearChat();
    }, [repoId, clearChat]);


    useEffect(() => {
        if (savedRepos.length === 0) {
            fetchRepos();
        }
    }, [savedRepos.length, fetchRepos]);


    if (!repoId) return <div className="p-10 text-white">Error: No Repository ID found.</div>;


    const expandChatPanel = () => {
        const layout = panelGroupRef.current?.getLayout();
        if (layout) {
            const newMiddleSize = layout[1] + (layout[0] - 25);
            panelGroupRef.current?.setLayout([25, newMiddleSize, layout[2]]);
        }
    };

    const expandCodePanel = () => {
        const layout = panelGroupRef.current?.getLayout();
        if (layout) {
            const newMiddleSize = layout[1] + (layout[2] - 25);
            panelGroupRef.current?.setLayout([layout[0], newMiddleSize, 25]);
        }
    };

    return (
        <CinematicWrapper className="h-screen overflow-hidden flex flex-col">

            <div className="h-14 mt-16 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between px-4 shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-white hover:bg-slate-800"
                        onClick={() => navigate('/dashboard')}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Dashboard
                    </Button>
                    <div className="h-4 w-[1px] bg-slate-800"></div>
                    <span className="text-xs font-mono text-slate-500 flex items-center gap-2">
                        REPO ID: <span className="text-cyan-400 bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-900/50">{repoId}</span>
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative w-full">
                <ResizablePanelGroup
                    ref={panelGroupRef}
                    direction="horizontal"
                    className="h-full w-full"
                >
                    <ResizablePanel
                        defaultSize={25}
                        minSize={15}
                        collapsible={true}
                        collapsedSize={4}
                        onCollapse={() => setIsChatCollapsed(true)}
                        onExpand={() => setIsChatCollapsed(false)}
                        className={`bg-slate-900/60 backdrop-blur-md border-r border-slate-800 ${isChatCollapsed ? 'min-w-[50px]' : ''}`}
                    >
                        {isChatCollapsed ? (
                            <CollapsedPanelContent label="Chat" onClick={expandChatPanel} />
                        ) : (
                            <ChatPanel repoId={repoId} />
                        )}
                    </ResizablePanel>

                    <ResizableHandle withHandle className="bg-slate-800 hover:bg-cyan-500 transition-colors w-[2px]" />

                    <ResizablePanel defaultSize={50} minSize={10} className="bg-transparent relative">
                        {/* Graph Container */}
                        <div className="absolute inset-0">
                            <RepoGraph />
                        </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle className="bg-slate-800 hover:bg-cyan-500 transition-colors w-[2px]" />

                    <ResizablePanel
                        defaultSize={25}
                        minSize={15}
                        collapsible={true}
                        collapsedSize={4}
                        onCollapse={() => setIsCodeCollapsed(true)}
                        onExpand={() => setIsCodeCollapsed(false)}
                        className={`bg-slate-900/60 backdrop-blur-md border-l border-slate-800 ${isCodeCollapsed ? 'min-w-[50px]' : ''}`}
                    >
                        {isCodeCollapsed ? (
                            <CollapsedPanelContent label="Code" onClick={expandCodePanel} />
                        ) : (
                            <CodeViewer />
                        )}
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </CinematicWrapper>
    );
};

export default RepoPage;