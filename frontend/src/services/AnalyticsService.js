import axios from 'axios';

const API_URL = 'http://localhost:8000/api/core/analytics/';

const analyticsService = {
    async getAnalyticsSummary() {
        try {
            const response = await axios.get(API_URL);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

export default analyticsService;
