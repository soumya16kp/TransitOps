import axios from 'axios';

const API_URL = 'http://localhost:8000/api/expenses/';

const fuelService = {
    async getFuelLogs() {
        try {
            const response = await axios.get(`${API_URL}fuel/`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    async createFuelLog(data) {
        try {
            const response = await axios.post(`${API_URL}fuel/`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    async getOtherExpenses() {
        try {
            const response = await axios.get(`${API_URL}other/`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    async createOtherExpense(data) {
        try {
            const response = await axios.post(`${API_URL}other/`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    async getSummary() {
        try {
            const response = await axios.get(`${API_URL}summary/`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

export default fuelService;
