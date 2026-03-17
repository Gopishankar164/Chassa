import ADMIN_API_BASE_URL from '../config/api.js';

const API_BASE_URL = `${ADMIN_API_BASE_URL}/api`;

export const returnExchangeService = {
    // Get all return/exchange requests
    async getAllRequests() {
        const response = await fetch(`${API_BASE_URL}/admin/return-exchange`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch return/exchange requests');
        }

        return response.json();
    },

    // Update request status
    async updateRequestStatus(requestId, status, adminNotes = '') {
        const response = await fetch(`${API_BASE_URL}/admin/return-exchange/${requestId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status, adminNotes })
        });

        if (!response.ok) {
            throw new Error('Failed to update request status');
        }

        return response.json();
    }
};
