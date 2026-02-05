import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, repoApi, chatApi } from '../services/api';
import { useChatStore } from './useChatStore';


interface User { id: string; email: string; name: string; }
interface Repository { id: string; name: string; url: string; status: 'PENDING' | 'INGESTING' | 'COMPLETED' | 'FAILED'; }
interface Highlight { startLine: number; endLine: number; }

interface AppState {
    currentUser: User | null;
    savedRepos: Repository[];

    isLoading: boolean;
    error: string | null;
    selectedNodeId: string | null;
    highlightedNodes: string[];
    currentHighlight: Highlight | null;
    reactFlowInstance: any;

    analyzingRepoId: string | null;
    analysisCurrentStep: number;
    selectedLlm: 'gemini' | 'groq';

    // Auth
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => void;
    verifySession: () => Promise<void>;

    // Repos
    fetchRepos: () => Promise<void>;
    addRepo: (url: string, name: string) => Promise<void>;
    deleteRepo: (id: string) => Promise<void>;

    // Chat
    askQuestion: (repoId: string, question: string) => Promise<void>;

    // UI Setters
    setSelectedNodeId: (nodeId: string | null) => void;
    setHighlightedNodes: (nodes: string[]) => void;
    setReactFlowInstance: (instance: any) => void;
    setCurrentHighlight: (highlight: Highlight | null) => void;
    setError: (error: string | null) => void;
    setSelectedLlm: (llm: 'gemini' | 'groq') => void;

    setAnalyzingRepoId: (id: string | null) => void;
    setAnalysisCurrentStep: (step: number) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({

            currentUser: null,
            savedRepos: [],
            isLoading: false,
            error: null,
            selectedNodeId: null,
            highlightedNodes: [],
            currentHighlight: null,
            reactFlowInstance: null,
            analyzingRepoId: null,
            analysisCurrentStep: 0,
            selectedLlm: 'gemini',

            setAnalyzingRepoId: (id) => set({ analyzingRepoId: id }),
            setAnalysisCurrentStep: (step) => set({ analysisCurrentStep: step }),
            setSelectedLlm: (llm) => set({ selectedLlm: llm }),
            setHighlightedNodes: (nodes) => set({ highlightedNodes: nodes }), 

            verifySession: async () => {
                const token = localStorage.getItem('token');
                if (!token) return;
                try {
                    const user = await authApi.getMe();
                    set({ currentUser: user });
                } catch (err) {
                    console.error("Session verification failed", err);
                    localStorage.removeItem('token');
                    set({ currentUser: null });
                }
            },

            login: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    const data = await authApi.login(email, password);
                    localStorage.setItem('token', data.token);
                    set({ currentUser: data.user, isLoading: false });
                } catch (err: any) {
                    set({ error: err.response?.data?.error || 'Login failed', isLoading: false });
                }
            },

            register: async (email, password, name) => {
                set({ isLoading: true, error: null });
                try {
                    const data = await authApi.register(email, password, name);
                    localStorage.setItem('token', data.token);
                    set({ currentUser: data.user, isLoading: false });
                } catch (err: any) {
                    set({ error: err.response?.data?.error || 'Registration failed', isLoading: false });
                }
            },

            logout: () => {
                localStorage.removeItem('token');
                useChatStore.getState().clearChat();
                set({ currentUser: null, savedRepos: [], analyzingRepoId: null, analysisCurrentStep: 0 });
            },

            checkAuth: () => {
                const token = localStorage.getItem('token');
                if (!token) {
                    set({ currentUser: null });
                }
            },

            fetchRepos: async () => {
                set({ isLoading: true, error: null });
                try {
                    const repos = await repoApi.getUserRepos();
                    set({ savedRepos: repos, isLoading: false });
                } catch (err: any) {
                    console.error(err);
                    set({ error: 'Failed to fetch repositories', isLoading: false });
                }
            },

            addRepo: async (url, name) => {
                set({ isLoading: true, error: null });
                try {
                    await repoApi.ingestRepo(url, name);
                    await get().fetchRepos();
                    set({ isLoading: false });
                } catch (err: any) {
                    set({ error: err.response?.data?.message || 'Failed to add repository', isLoading: false });
                }
            },

            deleteRepo: async (id) => {
                try {
                    await repoApi.deleteRepo(id);
                    set((state) => ({
                        savedRepos: state.savedRepos.filter((r) => r.id !== id)
                    }));
                } catch (err: any) {
                    set({ error: 'Failed to delete repository' });
                }
            },

            askQuestion: async (repoId, question) => {
                const { selectedLlm } = get();
                const { addMessage } = useChatStore.getState();

                // Add user message to chat store
                addMessage({ sender: 'user', message: question });

                set({
                    isLoading: true,
                    error: null,
                    highlightedNodes: []
                });

                try {
                    const response = await chatApi.sendMessage(repoId, question, selectedLlm);
                    const sources = response.sources || [];

                    // Add AI response to chat store
                    addMessage({
                        sender: 'ai',
                        message: response.answer,
                        sources: sources
                    });

                    set({ isLoading: false });

                    if (sources.length > 0) {
                        // Highlight all relevant nodes
                        const nodeIds = sources.map((s: any) => s.filePath.replace(/\\/g, '/'));
                        set({ highlightedNodes: nodeIds });

                        const firstSource = sources[0];
                        const firstNodeId = firstSource.filePath.replace(/\\/g, '/');

                        set({
                            currentHighlight: {
                                startLine: firstSource.startLine,
                                endLine: firstSource.endLine
                            }
                        });

                        // Wait 2 seconds then zoom to first node
                        setTimeout(() => {
                            set({ selectedNodeId: firstNodeId });
                            const { reactFlowInstance } = get();
                            if (reactFlowInstance) {
                                const node = reactFlowInstance.getNode(firstNodeId);
                                if (node) {
                                    reactFlowInstance.fitView({ nodes: [node], duration: 1000, padding: 0.2 });
                                }
                            }
                        }, 2000);
                    }

                } catch (err: any) {
                    addMessage({ sender: 'ai', message: "Sorry, I encountered an error answering that." });
                    set({ isLoading: false });
                }
            },

      
            setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),
            setCurrentHighlight: (highlight: Highlight | null) => set({ currentHighlight: highlight }),
            setReactFlowInstance: (instance) => set({ reactFlowInstance: instance }),
            setError: (error) => set({ error }),
        }),
        {
            name: 'reposcout-storage',
            partialize: (state) => ({
                currentUser: state.currentUser,
                savedRepos: state.savedRepos,
                analyzingRepoId: state.analyzingRepoId,
                analysisCurrentStep: state.analysisCurrentStep 
            }),
        }
    )
);