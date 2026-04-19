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

export default api;
