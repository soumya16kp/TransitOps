import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/maintenance';

const MaintenanceService = {
    /**
     * Get all maintenance records, optionally filtered.
     */
    async getServiceRecords(filters = {}) {
        try {
            const params = {};
            if (filters.vehicle) params.vehicle = filters.vehicle;
            if (filters.status)  params.status  = filters.status;

            const response = await axios.get(`${BASE_URL}/`, { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Create a new maintenance record.
     */
    async createServiceRecord(data) {
        try {
            const response = await axios.post(`${BASE_URL}/`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Update a maintenance record fully (PUT).
     */
    async updateServiceRecord(id, data) {
        try {
            const response = await axios.put(`${BASE_URL}/${id}/`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Partial update of a maintenance record (PATCH).
     */
    async patchServiceRecord(id, data) {
        try {
            const response = await axios.patch(`${BASE_URL}/${id}/`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Delete a maintenance record.
     */
    async deleteServiceRecord(id) {
        try {
            await axios.delete(`${BASE_URL}/${id}/`);
            return true;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },
};

export default MaintenanceService;
