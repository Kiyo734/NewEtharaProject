import React, { useState } from 'react';
import { LayoutDashboard, Package, Users, ShoppingBag } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Customers from './components/Customers';
import Orders from './components/Orders';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'products':
        return <Products />;
      case 'customers':
        return <Customers />;
      case 'orders':
        return <Orders />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Panel */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">
            <Package size={22} />
          </div>
          <span className="logo-text">StockFlow</span>
        </div>

        <nav>
          <ul className="nav-links">
            <li>
              <button 
                className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
                style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => setActiveTab('products')}
                style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
              >
                <Package size={18} />
                Products
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`}
                onClick={() => setActiveTab('customers')}
                style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
              >
                <Users size={18} />
                Customers
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
                style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
              >
                <ShoppingBag size={18} />
                Orders
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}
