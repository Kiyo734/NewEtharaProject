import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, RefreshCw } from 'lucide-react';
import { api } from '../api';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: ''
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenAdd = () => {
    setFormData({ fullName: '', email: '', phone: '' });
    setError(null);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer? This will also delete all associated orders.')) return;
    try {
      setError(null);
      setSuccess(null);
      await api.deleteCustomer(id);
      setSuccess('Customer deleted successfully.');
      fetchCustomers();
    } catch (err) {
      setError(err.message || 'Failed to delete customer.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Form validation
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError('All fields are required.');
      return;
    }

    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    const payload = {
      full_name: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim()
    };

    try {
      await api.createCustomer(payload);
      setSuccess('Customer registered successfully.');
      setModalOpen(false);
      fetchCustomers();
    } catch (err) {
      setError(err.message || 'Failed to create customer.');
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
          <h1 className="page-title">Customer Management</h1>
          <p className="page-subtitle">Manage client profiles, contact numbers, and emails</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={fetchCustomers}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} /> Add Customer
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
        ) : customers.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No customers found. Click "Add Customer" to register a client.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Phone Number</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.id}</td>
                  <td style={{ fontWeight: 600 }}>{customer.full_name}</td>
                  <td><code>{customer.email}</code></td>
                  <td>{customer.phone}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn btn-danger" 
                      style={{ padding: '6px 12px' }}
                      onClick={() => handleDelete(customer.id)}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
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
              <h2 className="modal-title">Add New Customer</h2>
              <button className="close-btn" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  name="fullName" 
                  className="form-input" 
                  placeholder="e.g. John Doe" 
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  className="form-input" 
                  placeholder="e.g. john.doe@example.com" 
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input 
                  type="text" 
                  name="phone" 
                  className="form-input" 
                  placeholder="e.g. +1 555-0199" 
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
