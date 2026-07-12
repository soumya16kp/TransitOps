import axios from 'axios';

const API_URL = 'http://localhost:8000/api/auth/';

// Configure axios defaults
axios.defaults.withCredentials = true;

const clearAuthStorage = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
};

// Add token to requests if it exists
const getToken = () => {
    return localStorage.getItem('access_token');
};

// Set auth token for all requests
axios.interceptors.request.use(
    (config) => {
        const token = getToken();
        const isRefreshRequest = config.url?.includes('/refresh/');

        if (token && !isRefreshRequest) {
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            delete config.headers.Authorization;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Token refresh interceptor
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const isRefreshRequest = originalRequest?.url?.includes('/refresh/');

        if (error.response?.status === 401 && !originalRequest?._retry && !isRefreshRequest) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (refreshToken) {
                    const response = await axios.post(`${API_URL}refresh/`, {
                        refresh: refreshToken
                    });
                    const { access } = response.data;
                    localStorage.setItem('access_token', access);
                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return axios(originalRequest);
                }
            } catch (refreshError) {
                clearAuthStorage();
                window.dispatchEvent(new Event('auth:logout'));
                window.location.assign('/login');
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

const authService = {
    async register(userData) {
        try {
            const response = await axios.post(`${API_URL}register/`, userData);
            if (response.data.access) {
                localStorage.setItem('access_token', response.data.access);
                localStorage.setItem('refresh_token', response.data.refresh);
            }
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    async login(credentials) {
        try {
            const response = await axios.post(`${API_URL}login/`, credentials);
            if (response.data.access) {
                localStorage.setItem('access_token', response.data.access);
                localStorage.setItem('refresh_token', response.data.refresh);
            }
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    async logout(refreshToken) {
        try {
            await axios.post(`${API_URL}logout/`, { refresh: refreshToken });
        } finally {
            clearAuthStorage();
        }
    },

    async getProfile() {
        try {
            const response = await axios.get(`${API_URL}profile/`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    async updateProfile(userData) {
        try {
            const response = await axios.put(`${API_URL}profile/`, userData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getCurrentUser() {
        const userData = localStorage.getItem('user_data');
        return userData ? JSON.parse(userData) : null;
    },

    isAuthenticated() {
        return !!localStorage.getItem('access_token');
    }
};

export default authService;