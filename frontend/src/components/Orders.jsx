import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, RefreshCw, Eye, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // New Order Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState([
    { product_id: '', quantity: 1 }
  ]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [ordersData, productsData, customersData] = await Promise.all([
        api.getOrders(),
        api.getProducts(),
        api.getCustomers()
      ]);

      setOrders(ordersData);
      setProducts(productsData);
      setCustomers(customersData);
    } catch (err) {
      setError(err.message || 'Failed to fetch order data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setSelectedCustomerId('');
    setOrderItems([{ product_id: '', quantity: 1 }]);
    setError(null);
    setCreateModalOpen(true);
  };

  const handleOpenDetails = async (orderId) => {
    try {
      setError(null);
      const detail = await api.getOrder(orderId);
      setSelectedOrder(detail);
      setDetailModalOpen(true);
    } catch (err) {
      setError(err.message || 'Failed to load order details.');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel and delete this order? This will restock all products.')) return;
    try {
      setError(null);
      setSuccess(null);
      await api.deleteOrder(orderId);
      setSuccess('Order cancelled and deleted successfully. Stock has been restored.');
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to cancel order.');
    }
  };

  // Manage OrderItems rows
  const handleAddItemRow = () => {
    setOrderItems([...orderItems, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveItemRow = (index) => {
    if (orderItems.length === 1) return;
    const newItems = [...orderItems];
    newItems.splice(index, 1);
    setOrderItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...orderItems];
    newItems[index][field] = value;
    setOrderItems(newItems);
  };

  // Live order total amount calculation
  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => {
      if (!item.product_id) return sum;
      const product = products.find(p => p.id === parseInt(item.product_id, 10));
      if (!product) return sum;
      return sum + (parseFloat(product.price) * item.quantity);
    }, 0);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedCustomerId) {
      setError('Please select a customer.');
      return;
    }

    // Filter out unselected rows or validate
    const validItems = orderItems.filter(item => item.product_id !== '');
    if (validItems.length === 0) {
      setError('Please add at least one product to the order.');
      return;
    }

    // Validate quantities and stock limits
    for (const item of validItems) {
      const prodId = parseInt(item.product_id, 10);
      const product = products.find(p => p.id === prodId);
      if (!product) continue;
      
      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        setError(`Please input a valid quantity for product '${product.name}'.`);
        return;
      }

      // Check sum of requested quantities in case the user specified the same product multiple times
      const totalReqQty = validItems
        .filter(i => parseInt(i.product_id, 10) === prodId)
        .reduce((s, i) => s + parseInt(i.quantity, 10), 0);

      if (product.quantity < totalReqQty) {
        setError(`Insufficient stock for product '${product.name}'. Available: ${product.quantity}, Requested: ${totalReqQty}.`);
        return;
      }
    }

    const payload = {
      customer_id: parseInt(selectedCustomerId, 10),
      items: validItems.map(item => ({
        product_id: parseInt(item.product_id, 10),
        quantity: parseInt(item.quantity, 10)
      }))
    };

    try {
      await api.createOrder(payload);
      setSuccess('Order created successfully!');
      setCreateModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to place order.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Order Management</h1>
          <p className="page-subtitle">Process client transactions, track invoices, and view receipts</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={fetchData}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Create Order
          </button>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && !createModalOpen && !detailModalOpen && (
        <div className="alert alert-error">{error}</div>
      )}

      <div className="table-container">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No orders found. Click "Create Order" to place your first invoice.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items Count</th>
                <th>Total Amount</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
                return (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td style={{ fontWeight: 600 }}>{order.customer?.full_name || `Customer ID ${order.customer_id}`}</td>
                    <td>{new Date(order.created_at).toLocaleString()}</td>
                    <td>{totalItems}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>
                      ${parseFloat(order.total_amount).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px' }}
                          onClick={() => handleOpenDetails(order.id)}
                        >
                          <Eye size={14} /> Details
                        </button>
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '6px 12px' }}
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          Cancel Order
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE ORDER MODAL */}
      {createModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Order</h2>
              <button className="close-btn" onClick={() => setCreateModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handlePlaceOrder}>
              {/* Select Customer */}
              <div className="form-group">
                <label className="form-label">Customer</label>
                <select 
                  className="form-input"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  required
                >
                  <option value="">-- Choose a Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Items Section */}
              <div style={{ margin: '1.5rem 0' }}>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Ordered Products
                </h3>
                
                <table className="order-builder-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th style={{ width: '120px' }}>Quantity</th>
                      <th style={{ width: '120px', textAlign: 'right' }}>Price</th>
                      <th style={{ width: '50px', textAlign: 'right' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item, index) => {
                      const selectedProduct = products.find(p => p.id === parseInt(item.product_id, 10));
                      const subtotal = selectedProduct ? parseFloat(selectedProduct.price) * item.quantity : 0;
                      
                      return (
                        <tr key={index}>
                          <td>
                            <select 
                              className="form-input"
                              value={item.product_id}
                              onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                              required
                            >
                              <option value="">-- Select Product --</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                                  {p.name} (SKU: {p.sku}) [Stock: {p.quantity}]
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input 
                              type="number" 
                              min="1" 
                              className="form-input"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value, 10) || 1)}
                              required
                            />
                          </td>
                          <td style={{ textAlign: 'right', verticalAlign: 'middle', fontWeight: 600 }}>
                            ${subtotal.toFixed(2)}
                          </td>
                          <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                            <button 
                              type="button" 
                              className="btn btn-danger"
                              style={{ padding: '6px', background: 'transparent', border: 'none' }}
                              onClick={() => handleRemoveItemRow(index)}
                              disabled={orderItems.length === 1}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={handleAddItemRow}
                >
                  <Plus size={16} /> Add Product Row
                </button>
              </div>

              {/* Total summary */}
              <div className="total-summary">
                <span>Order Total:</span>
                <span style={{ color: 'var(--success)', fontSize: '1.45rem' }}>
                  ${calculateTotal().toFixed(2)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setCreateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Place Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailModalOpen && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Order Details #{selectedOrder.id}</h2>
              <button className="close-btn" onClick={() => setDetailModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.9rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Customer Name:</span>
                  <p style={{ fontWeight: 600, marginTop: '2px' }}>
                    {selectedOrder.customer?.full_name || 'N/A'}
                  </p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Email Address:</span>
                  <p style={{ fontWeight: 600, marginTop: '2px' }}>
                    {selectedOrder.customer?.email || 'N/A'}
                  </p>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Phone Number:</span>
                  <p style={{ fontWeight: 600, marginTop: '2px' }}>
                    {selectedOrder.customer?.phone || 'N/A'}
                  </p>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Order Date:</span>
                  <p style={{ fontWeight: 600, marginTop: '2px' }}>
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase' }}>
              Purchased Items
            </h3>
            
            <table className="data-table" style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Quantity</th>
                  <th style={{ textAlign: 'right' }}>Price Paid</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items.map((item) => {
                  const unitPrice = parseFloat(item.unit_price);
                  const subtotal = unitPrice * item.quantity;
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.product?.name || `Product ID ${item.product_id}`}</td>
                      <td><code>{item.product?.sku || 'N/A'}</code></td>
                      <td>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>${unitPrice.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>
                        ${subtotal.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="total-summary" style={{ marginBottom: 0 }}>
              <span>Total Amount:</span>
              <span style={{ color: 'var(--success)', fontSize: '1.45rem' }}>
                ${parseFloat(selectedOrder.total_amount).toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setDetailModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
