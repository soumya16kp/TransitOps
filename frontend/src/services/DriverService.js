import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/drivers';

const driverService = {
    /**
     * List all drivers with optional filters.
     * @param {{ category?: string, status?: string, search?: string }} filters
     */
    async getDrivers(filters = {}) {
        try {
            const params = {};
            if (filters.category && filters.category !== 'All') params.category = filters.category;
            if (filters.status && filters.status !== 'All') params.status = filters.status;
            if (filters.search) params.search = filters.search;

            const response = await axios.get(`${BASE_URL}/`, { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Get a single driver by ID.
     */
    async getDriver(id) {
        try {
            const response = await axios.get(`${BASE_URL}/${id}/`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Create a new driver.
     */
    async createDriver(data) {
        try {
            const response = await axios.post(`${BASE_URL}/`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Full update of a driver.
     */
    async updateDriver(id, data) {
        try {
            const response = await axios.put(`${BASE_URL}/${id}/`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Partial update of a driver.
     */
    async patchDriver(id, data) {
        try {
            const response = await axios.patch(`${BASE_URL}/${id}/`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Delete a driver by ID.
     */
    async deleteDriver(id) {
        try {
            await axios.delete(`${BASE_URL}/${id}/`);
            return true;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Fetch choices.
     */
    async getChoices() {
        try {
            const response = await axios.get(`${BASE_URL}/choices/`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },
};

export default driverService;
