import ADMIN_API_BASE_URL from '../config/api.js';

const API_BASE_URL = `${ADMIN_API_BASE_URL}/api`;

export const orderService = {
  // Get all orders for admin
  async getAllOrders() {
    const response = await fetch(`${API_BASE_URL}/admin/orders`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }

    return response.json();
  },

  // Get order by ID
  async getOrderById(orderId) {
    const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch order details');
    }

    return response.json();
  },

  // ✅ Update order status (FIXED endpoint with auto-payment completion)
  async updateOrderStatus(orderId, status) {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      throw new Error('Failed to update order status');
    }

    const result = await response.json();

    // ✅ Auto-complete payment when delivered
    if (status === 'DELIVERED') {
      try {
        await this.updatePaymentStatus(orderId, 'COMPLETED', 'Auto-completed on delivery');
      } catch (error) {
        console.error('Failed to auto-complete payment:', error);
      }
    }

    return result;
  },

  // Update payment status
  async updatePaymentStatus(orderId, paymentStatus, remarks = '') {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/update-payment-status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentStatus: paymentStatus,
        remarks: remarks
      })
    });

    if (!response.ok) {
      throw new Error('Failed to update payment status');
    }

    return response.json();
  },

  // Cancel order
  async cancelOrder(orderId, reason = '') {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });

    if (!response.ok) {
      throw new Error('Failed to cancel order');
    }

    return response.json();
  }
};