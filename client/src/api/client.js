import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 120000,
    headers: { 'Content-Type': 'application/json' }
});

export const submitQuery = async (payload) => {
    const { data } = await api.post('/query', payload);
    return data;
};

export const getHistory = async (sessionId) => {
    const { data } = await api.get(`/history/${sessionId}`);
    return data;
};

export const getAllSessions = async () => {
    const { data } = await api.get('/history');
    return data;
};

export const toggleBookmark = async (sessionId, item) => {
    const { data } = await api.post(`/history/${sessionId}/bookmark`, item);
    return data;
};

export const getStatus = async () => {
    const { data } = await api.get('/query/status');
    return data;
};

// Auth API
export const loginUser = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    return data;
};

export const registerUser = async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    return data;
};

// Add interceptor to include token in requests
api.interceptors.request.use((config) => {
    const userStr = localStorage.getItem('curalink_user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            if (user && user.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }
        } catch (e) {
            console.error('Error parsing user token', e);
        }
    }
    return config;
});

export default api;
