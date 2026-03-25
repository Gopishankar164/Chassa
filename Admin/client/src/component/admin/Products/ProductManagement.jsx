import React, { useState } from 'react';
import {
  PageHeader,
  Card,
  Table,
  Button,
  Input,
  Modal,
  ConfirmModal
} from '../../../components/shared';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

const ProductManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [products, setProducts] = useState([
    { id: 1, name: 'Wireless Headphones', category: 'Electronics', price: 79.99, stock: 45, status: 'active' },
    { id: 2, name: 'Phone Case', category: 'Accessories', price: 19.99, stock: 120, status: 'active' },
    { id: 3, name: 'USB-C Cable', category: 'Electronics', price: 12.99, stock: 8, status: 'active' },
    { id: 4, name: 'Screen Protector', category: 'Accessories', price: 9.99, stock: 50, status: 'inactive' },
  ]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateProduct = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleDeleteProduct = (product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    setProducts(products.filter(p => p.id !== selectedProduct.id));
    setIsDeleteModalOpen(false);
  };

  const stockStatus = (stock) => {
    if (stock <= 5) return { level: 'critical', color: 'red', label: 'Low Stock' };
    if (stock <= 20) return { level: 'warning', color: 'yellow', label: 'Limited Stock' };
    return { level: 'good', color: 'green', label: 'In Stock' };
  };

  return (
    <div>
      <PageHeader
        title="Products Management"
        subtitle="Manage your product catalog and inventory"
        actions={
          <Button onClick={handleCreateProduct}>
            <Plus size={18} />
            Add Product
          </Button>
        }
      />

      {/* Search Bar */}
      <Card className="mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </Card>

      {/* Products Table */}
      <Card>
        <Table
          columns={[
            { key: 'id', label: 'ID', sortable: true },
            { key: 'name', label: 'Product Name', sortable: true },
            { key: 'category', label: 'Category', sortable: true },
            {
              key: 'price',
              label: 'Price',
              sortable: true,
              render: (price) => `$${price.toFixed(2)}`
            },
            {
              key: 'stock',
              label: 'Stock Status',
              render: (stock) => {
                const status = stockStatus(stock);
                return (
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-${status.color}-500`}></div>
                    <span className="text-sm">{status.label} ({stock})</span>
                  </div>
                );
              }
            },
            {
              key: 'status',
              label: 'Status',
              render: (status) => (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                }`}>
                  {status === 'active' ? 'Active' : 'Inactive'}
                </span>
              )
            },
            {
              key: 'id',
              label: 'Actions',
              render: (id, row) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditProduct(row)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(row)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            },
          ]}
          data={filteredProducts}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedProduct(null);
        }}
        title={selectedProduct ? 'Edit Product' : 'Create New Product'}
        size="lg"
      >
        <form className="space-y-4">
          <Input label="Product Name" placeholder="Enter product name" required />
          <Input label="Category" placeholder="Enter category" required />
          <Input label="Price" type="number" placeholder="0.00" required />
          <Input label="Stock Quantity" type="number" placeholder="0" required />
          <textarea
            placeholder="Product description..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedProduct(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isDangerous
      />
    </div>
  );
};

export default ProductManagement;

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
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${ADMIN_API_BASE_URL}/api/products?page=${page}&size=${size}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
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
          <h2 className="page-heading">Engineering Products</h2>
          <p className="page-heading-sub">{products.length} components in catalogue</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddProduct(true)}>
          <Plus size={15} /> Add Component
        </button>
      </div>

      {/* Table */}
      <div className="data-card">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Quote / Price</th>
                <th>Availability</th>
                <th>Eng. Category</th>
                <th>Discount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan="7">
                  <div className="state-empty"><Package size={40} /><p>No components found</p></div>
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
      title="Add New Component" submitText="Add Component" />
      </Modal>
      <Modal isOpen={!!editingProduct} onClose={() => setEditingProduct(null)}>
      <ProductForm formState={editingProduct} setFormState={setEditingProduct}
      onSubmit={handleUpdateProduct} onClose={() => setEditingProduct(null)}
      title="Edit Component" submitText="Update Component" />
      </Modal>
    </div>
  );
};

export default ProductManagement;