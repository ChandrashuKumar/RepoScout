import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    message: string;
    sources?: { filePath: string; startLine: number; endLine: number }[];
}

interface ChatState {
    chatHistory: ChatMessage[];
    hasHydrated: boolean;

    addMessage: (message: Omit<ChatMessage, 'id'>) => void;
    clearChat: () => void;
    setHasHydrated: (hydrated: boolean) => void;
}

export const useChatStore = create<ChatState>()(
    persist(
        (set) => ({
            chatHistory: [],
            hasHydrated: false,

            addMessage: (message) => set((state) => ({
                chatHistory: [
                    ...state.chatHistory,
                    { ...message, id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }
                ]
            })),

            clearChat: () => set({ chatHistory: [] }),

            setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
        }),
        {
            name: 'reposcout-chat',
            storage: createJSONStorage(() => sessionStorage),
            partialize: (state) => ({ chatHistory: state.chatHistory }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
