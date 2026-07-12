import axios from 'axios';

const API_URL = 'http://localhost:8000/api/vehicles/documents/';

const documentService = {
    async uploadDocument(vehicleId, documentType, file) {
        try {
            const formData = new FormData();
            formData.append('vehicle_id', vehicleId);
            formData.append('document_type', documentType);
            formData.append('file', file);

            const response = await axios.post(`${API_URL}upload/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    async deleteDocument(docId) {
        try {
            const response = await axios.delete(`${API_URL}${docId}/`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

export default documentService;
