import React from 'react';
import { Eye, CheckCircle, Download } from 'lucide-react';
import '../../../styles/OrderManagement.css'; 

const OrderTable = ({ orders }) => {
  return (
    <div className="orders-table-container">
      <table className="orders-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Products</th>
            <th>Total</th>
            <th>Payment Method</th>
            <th>Payment Status</th>
            <th>Order Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>
                <a href="#" className="order-id">#{order.id}</a>
              </td>
              <td>
                <span className="customer-name">{order.customerName || 'N/A'}</span>
              </td>
              <td>
                <span className="products-count">{order.items?.length || 0} items</span>
              </td>
              <td>
                <span className="total-amount">₹{order.total}</span>
              </td>
              <td>
                <span className={`payment-method ${order.paymentMethod?.toLowerCase()}`}>
                  {order.paymentMethod || 'N/A'}
                </span>
              </td>
              <td>
                {order.paymentMethod === 'COD' ? (
                  <select
                    className={`payment-status ${order.paymentStatus?.toLowerCase()}`}
                    value={order.paymentStatus || 'PENDING'}
                    onChange={(e) => handlePaymentStatusChange(order.id, e.target.value)}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="FAILED">Failed</option>
                  </select>
                ) : (
                  <span className={`payment-status ${order.paymentStatus?.toLowerCase() || 'completed'}`}>
                    {order.paymentStatus || 'COMPLETED'}
                  </span>
                )}
              </td>
              <td>
                <select
                  className={`order-status-select ${order.status?.toLowerCase()}`}
                  value={order.status || 'PENDING'}
                  onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                  disabled={order.status === 'DELIVERED' || order.status === 'CANCELLED'}
                >
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="SHIPPED"> Shipped</option>
                  <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </td>
              <td>
                <span className="order-date">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </td>
              <td>
                <div className="order-actions">
                  <button className="action-btn view" title="View Details">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="action-btn edit" title="Edit Order">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button className="action-btn download" title="Download Invoice">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderTable;