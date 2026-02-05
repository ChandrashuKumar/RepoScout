import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5555';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auto-logout on 401/403 (expired or invalid token)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('token');
            window.location.href = '/auth';
        }
        return Promise.reject(error);
    }
);

export const authApi = {
    login: async (email: string, password: string) => {
        const res = await api.post('/auth/login', { email, password });
        return res.data; 
    },
    register: async (email: string, password: string, name: string) => {
        const res = await api.post('/auth/register', { email, password, name });
        return res.data; 
    },
    getMe: async () => {
        
        const response = await api.get('/auth/me');
        return response.data;
    }
};

export const repoApi = {
    ingestRepo: async (repoUrl: string, repoName: string) => {
        const res = await api.post('/api/ingest', { repoUrl, repoName });
        return res.data; 
    },

  
    getUserRepos: async () => {
        const res = await api.get('/api/repos');
        return res.data;
    },

 
    getRepo: async (repoId: string) => {
     
        const res = await api.get(`/api/repos/${repoId}/status`);
        return res.data;
    },


    deleteRepo: async (repoId: string) => {
        const res = await api.delete(`/api/repos/${repoId}`);
        return res.data;
    },

    getRepoGraph: async (repoId: string) => {
        const res = await api.get(`/api/repos/${repoId}/graph`);
        return res.data;
    },
    getFileContent: async (fileId: string) => {
        const res = await api.get(`/api/repos/files/${fileId}`);
        return res.data;
    }
};

export const chatApi = {
    sendMessage: async (repoId: string, question: string, llm: string = 'gemini') => {
        const res = await api.post(`/api/chat/${repoId}`, { question, llm });
        return res.data;
    }
};

export const systemApi = {
    checkHealth: async () => {
        const res = await api.get('/api/health');
        return res.data;
    }
};


export default api;