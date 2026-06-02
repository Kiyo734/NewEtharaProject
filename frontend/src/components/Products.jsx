import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, RefreshCw } from 'lucide-react';
import { api } from '../api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    quantity: ''
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({ name: '', sku: '', price: '', quantity: '0' });
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      price: product.price,
      quantity: product.quantity.toString()
    });
    setError(null);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      setError(null);
      setSuccess(null);
      await api.deleteProduct(id);
      setSuccess('Product deleted successfully.');
      fetchProducts();
    } catch (err) {
      setError(err.message || 'Failed to delete product. It might be referenced in an existing order.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Frontend validations
    if (!formData.name.trim() || !formData.sku.trim() || !formData.price || !formData.quantity) {
      setError('All fields are required.');
      return;
    }

    const priceNum = parseFloat(formData.price);
    const qtyNum = parseInt(formData.quantity, 10);

    if (isNaN(priceNum) || priceNum < 0) {
      setError('Price must be a valid non-negative number.');
      return;
    }

    if (isNaN(qtyNum) || qtyNum < 0) {
      setError('Quantity cannot be negative.');
      return;
    }

    const payload = {
      name: formData.name,
      sku: formData.sku.trim().toUpperCase(),
      price: priceNum,
      quantity: qtyNum
    };

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
        setSuccess('Product updated successfully.');
      } else {
        await api.createProduct(payload);
        setSuccess('Product created successfully.');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      setError(err.message || 'Failed to save product.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Product Management</h1>
          <p className="page-subtitle">Add, edit, or remove items in your catalog</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={fetchProducts}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && !modalOpen && <div className="alert alert-error">{error}</div>}

      <div className="table-container">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No products found. Click "Add Product" to create your first catalog item.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product Name</th>
                <th>SKU Code</th>
                <th>Price</th>
                <th>Stock Quantity</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td style={{ fontWeight: 600 }}>{product.name}</td>
                  <td><code>{product.sku}</code></td>
                  <td>${parseFloat(product.price).toFixed(2)}</td>
                  <td>
                    <span style={{ 
                      fontWeight: 600, 
                      color: product.quantity < 10 ? 'var(--error)' : 'inherit'
                    }}>
                      {product.quantity}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px' }}
                        onClick={() => handleOpenEdit(product)}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '6px 12px' }}
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingProduct ? 'Edit Product Details' : 'Add New Product'}
              </h2>
              <button className="close-btn" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input 
                  type="text" 
                  name="name" 
                  className="form-input" 
                  placeholder="e.g. Wireless Mouse" 
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">SKU / Code</label>
                <input 
                  type="text" 
                  name="sku" 
                  className="form-input" 
                  placeholder="e.g. MOUSE-WRLS-01" 
                  value={formData.sku}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="price" 
                    className="form-input" 
                    placeholder="0.00" 
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Stock Quantity</label>
                  <input 
                    type="number" 
                    name="quantity" 
                    className="form-input" 
                    placeholder="0" 
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
