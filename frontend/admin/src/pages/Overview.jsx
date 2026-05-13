import React, { useState, useEffect } from 'react';
import { Users, Briefcase, AlertCircle, IndianRupee } from 'lucide-react';

export default function Overview() {
  const [metrics, setMetrics] = useState({
    activeWorkers: '...',
    jobsToday: '...',
    openDisputes: '...',
    escrowVolume: '...'
  });

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/overview');
      const json = await res.json();
      if(json.success) {
        setMetrics(json.data);
      }
    } catch (e) {
      console.error('Failed to fetch admin metrics', e);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll every 5s for live dashboard feel
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: 'Active Workers', value: metrics.activeWorkers, icon: Users, color: '#8b5cf6' },
    { label: 'Total Jobs', value: metrics.jobsToday, icon: Briefcase, color: '#10b981' },
    { label: 'Open Disputes', value: metrics.openDisputes, icon: AlertCircle, color: '#f59e0b' },
    { label: 'Escrow Volume', value: metrics.escrowVolume, icon: IndianRupee, color: '#0ea5e9' }
  ];

  return (
    <>
      <header className="page-header">
        <h1>Platform Overview</h1>
        <p>Real-time DB telemetry across Bengaluru</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        {stats.map((stat, idx) => (
          <div className="glass-panel" key={idx} style={{ animationDelay: `${idx * 0.1}s` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <stat.icon size={24} color={stat.color} />
              <span className="status-badge" style={{ background: `${stat.color}20`, color: stat.color }}>LIVE</span>
            </div>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{stat.value}</h2>
            <p style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel" style={{ animationDelay: '0.5s' }}>
         <h3 style={{ marginBottom: '1.5rem' }}>Recent DB Jobs</h3>
         <table>
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Trade</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>#1 (Mock PostgreSQL Row)</td>
                <td>Plumber</td>
                <td>Koramangala</td>
                <td><span className="status-badge success">Matched</span></td>
              </tr>
            </tbody>
         </table>
      </div>
    </>
  );
}
