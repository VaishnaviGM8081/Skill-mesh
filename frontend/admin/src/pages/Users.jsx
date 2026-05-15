import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Shield, Search } from 'lucide-react';

export default function UsersPage() {
  const [workers, setWorkers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const json = await res.json();
      
      if (json.success) {
        setWorkers(json.data.workers);
        setCustomers(json.data.customers);
      }
      setLoading(false);
    } catch (e) {
      console.error('Error fetching users', e);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <>
      <header className="page-header">
        <h1>User Management</h1>
        <p>Monitor and manage SkillMesh service providers and customers</p>
      </header>

      <div className="glass-panel" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Search size={20} color="var(--text-muted)" />
        <input 
          type="text" 
          placeholder="Search by name, trade or phone..." 
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: 'white', 
            fontSize: '1rem', 
            width: '100%',
            outline: 'none'
          }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* Workers Section */}
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--accent-primary)', padding: '0.5rem', borderRadius: '8px' }}>
              <Shield size={20} color="white" />
            </div>
            <h2 style={{ fontSize: '1.25rem' }}>Service Providers (Workers)</h2>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Trade</th>
                <th>Rating</th>
                <th>Total Jobs</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workers.map(worker => (
                <tr key={worker.id}>
                  <td>{worker.name}</td>
                  <td>{worker.trade_category || 'General'}</td>
                  <td>⭐ {worker.average_rating || 0}</td>
                  <td>{worker.phone}</td>
                  <td>
                    <span className="status-badge success">Verified</span>
                  </td>
                  <td>
                    <button className="action-btn">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Customers Section */}
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: '#10b981', padding: '0.5rem', borderRadius: '8px' }}>
              <Users size={20} color="white" />
            </div>
            <h2 style={{ fontSize: '1.25rem' }}>Customers</h2>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.phone}</td>
                  <td>
                    <button className="action-btn" style={{ background: 'rgba(255,255,255,0.1)' }}>View History</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </>
  );
}
