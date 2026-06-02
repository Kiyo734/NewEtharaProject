import React, { useState, useEffect } from 'react';
import { Package, Users, ShoppingBag, AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react';
import { api } from '../api';

export default function Dashboard({ setActiveTab }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  const { total_products, total_customers, total_orders, low_stock_products } = summary;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Real-time overview of your business metrics</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchSummary}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
            <Package size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Products</span>
            <span className="metric-value">{total_products}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <Users size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Customers</span>
            <span className="metric-value">{total_customers}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <ShoppingBag size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Orders</span>
            <span className="metric-value">{total_orders}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrapper" style={{ 
            background: low_stock_products.length > 0 ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
            color: low_stock_products.length > 0 ? '#f43f5e' : '#10b981' 
          }}>
            <AlertTriangle size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Low Stock Items</span>
            <span className="metric-value" style={{ color: low_stock_products.length > 0 ? '#f43f5e' : 'inherit' }}>
              {low_stock_products.length}
            </span>
          </div>
        </div>
      </div>

      {/* Dashboard Lists */}
      <div className="dashboard-grid">
        {/* Low Stock Alerts */}
        <div>
          <div className="page-header" style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
              Low Stock Alert (Under 10 Units)
            </h2>
          </div>
          
          <div className="table-container">
            {low_stock_products.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                🎉 All products are sufficiently stocked.
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {low_stock_products.map((product) => (
                    <tr key={product.id}>
                      <td style={{ fontWeight: 600 }}>{product.name}</td>
                      <td><code>{product.sku}</code></td>
                      <td>${parseFloat(product.price).toFixed(2)}</td>
                      <td style={{ fontWeight: 600 }}>{product.quantity}</td>
                      <td>
                        <span className={`badge ${product.quantity === 0 ? 'badge-error' : 'badge-warning'}`}>
                          {product.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', padding: '1.5rem', backdropFilter: 'blur(8px)', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '1.25rem' }}>
            Quick Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn btn-secondary" style={{ justifyContent: 'space-between', width: '100%' }} onClick={() => setActiveTab('products')}>
              Manage Products <ArrowRight size={16} />
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'space-between', width: '100%' }} onClick={() => setActiveTab('customers')}>
              Manage Customers <ArrowRight size={16} />
            </button>
            <button className="btn btn-primary" style={{ justifyContent: 'space-between', width: '100%' }} onClick={() => setActiveTab('orders')}>
              Create New Order <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
