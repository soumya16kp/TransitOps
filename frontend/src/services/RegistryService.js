import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/vehicles';

const registryService = {
    /**
     * List all vehicles with optional filters.
     * @param {{ type?: string, status?: string, search?: string }} filters
     */
    async getVehicles(filters = {}) {
        try {
            const params = {};
            if (filters.type   && filters.type   !== 'All') params.type   = filters.type;
            if (filters.status && filters.status !== 'All') params.status = filters.status;
            if (filters.search) params.search = filters.search;

            const response = await axios.get(`${BASE_URL}/`, { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Get a single vehicle by ID.
     */
    async getVehicle(id) {
        try {
            const response = await axios.get(`${BASE_URL}/${id}/`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Create a new vehicle.
     * @param {{ registration_no, name, vehicle_type, capacity, odometer, acquisition_cost, status, notes }} data
     */
    async createVehicle(data) {
        try {
            const response = await axios.post(`${BASE_URL}/`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Full update of a vehicle.
     */
    async updateVehicle(id, data) {
        try {
            const response = await axios.put(`${BASE_URL}/${id}/`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Partial update of a vehicle.
     */
    async patchVehicle(id, data) {
        try {
            const response = await axios.patch(`${BASE_URL}/${id}/`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Delete a vehicle by ID.
     */
    async deleteVehicle(id) {
        try {
            await axios.delete(`${BASE_URL}/${id}/`);
            return true;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Fetch valid type and status choices from the backend.
     */
    async getChoices() {
        try {
            const response = await axios.get(`${BASE_URL}/choices/`);
            return response.data;   // { types: [...], statuses: [...] }
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },
};

export default registryService;
