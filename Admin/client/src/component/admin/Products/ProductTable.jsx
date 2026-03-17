import React, { useState } from 'react';
import './ProductTable.css';
import ADMIN_API_BASE_URL from '../../../config/api';

const ProductTable = ({ products, onRefresh }) => {
  const [editingId, setEditingId] = useState(null);
  const [discountValue, setDiscountValue] = useState('');
  const [loading, setLoading] = useState(false);

  // Start editing a discount
  const handleEditDiscount = (product) => {
    setEditingId(product.id);
    setDiscountValue(product.discountPercentage ?? '');
  };

  // Save discount to backend
  const handleSaveDiscount = async (productId) => {
    if (discountValue === '' || discountValue < 0 || discountValue > 100) {
      alert('Please enter a valid discount percentage (0-100)');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert('No authentication token found. Please login again.');
        return;
      }
      const response = await fetch(
        `${ADMIN_API_BASE_URL}/api/admin/products/${productId}/discount`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            discountPercentage: Number(discountValue),
            isDiscountActive: true
          })
        }
      );
      if (response.ok) {
        alert('✅ Discount applied successfully!');
        setEditingId(null);
        setDiscountValue('');
        onRefresh && onRefresh(); // Refresh product list if provided
      } else {
        const error = await response.text();
        alert('❌ Failed to apply discount: ' + error);
      }
    } catch (error) {
      alert('❌ Error setting discount');
    } finally {
      setLoading(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setEditingId(null);
    setDiscountValue('');
  };

  return (
    <div className="product-table-container">
      <table className="product-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Discount</th>
            <th>Final Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>₹{product.price}</td>
              <td>
                {editingId === product.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      value={discountValue}
                      min="0"
                      max="100"
                      onChange={e => setDiscountValue(e.target.value)}
                      style={{ width: 60 }}
                      disabled={loading}
                    />
                    <button
                      onClick={() => handleSaveDiscount(product.id)}
                      disabled={loading}
                      style={{ color: 'green', fontWeight: 'bold', fontSize: 18, cursor: 'pointer', border: 'none', background: 'none' }}
                      title="Save"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      style={{ color: 'red', fontWeight: 'bold', fontSize: 18, cursor: 'pointer', border: 'none', background: 'none' }}
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  product.isDiscountActive ? (
                    <span>{product.discountPercentage}% OFF</span>
                  ) : (
                    <span>No discount</span>
                  )
                )}
              </td>
              <td>
                {product.isDiscountActive && product.discountedPrice
                  ? `₹${product.discountedPrice}`
                  : `₹${product.price}`}
              </td>
              <td>
                <button onClick={() => handleEditDiscount(product)}>
                  🏷️ Edit Discount
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;