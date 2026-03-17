import React, { useState, useEffect } from 'react';
import ProductForm from './ProductForm';
import Modal from '../../../shared/Modal';
import '../../../styles/GlobalAdmin.css';
import '../../../styles/ProductManagement.css';
import ADMIN_API_BASE_URL from '../../../config/api';
import { Plus, Package, RefreshCw } from 'lucide-react';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', category: '', description: '' });
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [discountEditId, setDiscountEditId] = useState(null);
  const [discountValue, setDiscountValue] = useState('');
  const [loading, setLoading] = useState(false);
  const size = 10;

  useEffect(() => {
    const fetchProducts = async () => {
      const res = await fetch(`${ADMIN_API_BASE_URL}/api/products?page=${page}&size=${size}`);
      const data = await res.json();
      if (data.length < size) setHasMore(false);
      setProducts(prev => page === 0 ? data : [...prev, ...data]);
    };
    fetchProducts();
  }, [page]);

  const handleAddProduct = async (productData) => {
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(productData),
      });
      if (!response.ok) throw new Error('Failed to add product');
      const addedProduct = await response.json();
      setProducts(prev => [addedProduct, ...prev]);
      setShowAddProduct(false);
    } catch { alert('Failed to add product'); }
  };

  const handleUpdateProduct = async (productData) => {
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(productData),
      });
      if (!response.ok) throw new Error();
      const updated = await response.json();
      setProducts(products.map(p => p.id === editingProduct.id ? updated : p));
      setEditingProduct(null);
    } catch { alert('Failed to update product'); }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Delete this product?')) return;
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${ADMIN_API_BASE_URL}/api/products/${productId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setProducts(products.filter(p => p.id !== productId));
    else alert('Failed to delete product');
  };

  const handleEditDiscount = (product) => {
    setDiscountEditId(product.id);
    setDiscountValue(product.discountPercentage ?? '');
  };

  const handleSaveDiscount = async (productId) => {
    if (discountValue === '' || discountValue < 0 || discountValue > 100) {
      alert('Enter a valid discount (0–100)'); return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/products/${productId}/discount`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ discountPercentage: Number(discountValue), isDiscountActive: true }),
      });
      if (response.ok) {
        const result = await response.json();
        setProducts(products.map(p => p.id === productId ? { ...p, ...result.product } : p));
        setDiscountEditId(null); setDiscountValue('');
      } else alert('Failed to apply discount');
    } catch { alert('Error setting discount'); }
    finally { setLoading(false); }
  };

  return (
    <div className="page-wrap">
      {/* Header */}
      <div className="page-header-bar">
        <div>
          <h2 className="page-heading">Product Management</h2>
          <p className="page-heading-sub">{products.length} products in catalogue</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddProduct(true)}>
          <Plus size={15} /> Add Product
        </button>
      </div>

      {/* Table */}
      <div className="data-card">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Category</th>
                <th>Discount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan="7">
                  <div className="state-empty"><Package size={40} /><p>No products found</p></div>
                </td></tr>
              ) : products.map(product => (
                <tr key={product.id}>
                  <td className="prod-name-cell">
                    {product.images?.length > 0 && (
                      <img src={product.images[0]} alt={product.name} className="prod-thumb"
                        onError={e => e.target.style.display = 'none'} />
                    )}
                    {product.name}
                  </td>
                  <td><strong>₹{product.price}</strong></td>
                  <td>
                    {(() => {
                      const qty = product.stockQuantity ?? product.stock ?? null;
                      if (qty === null || qty === undefined || qty === '') {
                        return <span className="badge badge-gray">N/A</span>;
                      }
                      const n = Number(qty);
                      return (
                        <span className={`badge ${n <= 5 ? 'badge-red' : n <= 15 ? 'badge-yellow' : 'badge-green'}`}>
                          {n}
                        </span>
                      );
                    })()}
                  </td>
                  <td><span className="badge badge-indigo">{product.category}</span></td>
                  <td>
                    {discountEditId === product.id ? (
                      <div className="discount-edit-row">
                        <input type="number" className="discount-input" min="0" max="100"
                          value={discountValue} onChange={e => setDiscountValue(e.target.value)} disabled={loading} />
                        <button className="tick-btn" onClick={() => handleSaveDiscount(product.id)} disabled={loading}>✓</button>
                        <button className="cross-btn" onClick={() => { setDiscountEditId(null); setDiscountValue(''); }} disabled={loading}>✕</button>
                      </div>
                    ) : (
                      <div className="discount-edit-row">
                        {product.isDiscountActive && product.discountPercentage ? (
                          <span className="badge badge-green">{product.discountPercentage}% OFF</span>
                        ) : (
                          <span className="badge badge-gray">No Discount</span>
                        )}
                        <button className="btn-edit" style={{ padding: '5px 10px', fontSize: 11 }}
                          onClick={() => handleEditDiscount(product)} title="Edit Discount">🏷️ Set</button>
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${product.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                      {product.status || 'active'}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn-edit" onClick={() => setEditingProduct(product)}>✏️ Edit</button>
                      <button className="btn-danger" onClick={() => handleDelete(product.id)}>🗑️ Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hasMore && (
          <div className="load-more-row">
            <button className="btn-secondary" onClick={() => setPage(prev => prev + 1)}>
              <RefreshCw size={14} /> Load More
            </button>
          </div>
        )}
      </div>

      <Modal isOpen={showAddProduct} onClose={() => setShowAddProduct(false)}>
        <ProductForm formState={newProduct} setFormState={setNewProduct}
          onSubmit={handleAddProduct} onClose={() => setShowAddProduct(false)}
          title="Add New Product" submitText="Add Product" />
      </Modal>
      <Modal isOpen={!!editingProduct} onClose={() => setEditingProduct(null)}>
        <ProductForm formState={editingProduct} setFormState={setEditingProduct}
          onSubmit={handleUpdateProduct} onClose={() => setEditingProduct(null)}
          title="Edit Product" submitText="Update Product" />
      </Modal>
    </div>
  );
};

export default ProductManagement;