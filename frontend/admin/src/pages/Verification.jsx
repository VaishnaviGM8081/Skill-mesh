import React, { useState, useEffect } from 'react';

export default function Verification() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/jobs/admin/verify/queue');
      const json = await res.json();
      if (json.success) setQueue(json.data);
    } catch (e) {
      console.error('Failed to fetch queue', e);
    } finally {
      setLoading(false);
    }
  };

  const approveWorker = async (id) => {
    try {
      const res = await fetch('/api/jobs/admin/verify/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worker_id: id })
      });
      const json = await res.json();
      if (json.success) {
        setQueue(queue.filter(w => w.id !== id));
        alert('Worker verified successfully!');
      }
    } catch (e) {
      alert('Verification failed');
    }
  };

  if (loading) return <div className="loading">Loading Queue...</div>;

  return (
    <>
      <header className="page-header">
        <h1>KYC Verification Queue</h1>
        <p>Review worker documents and grant verified status</p>
      </header>

      <div className="glass-panel" style={{ animationDelay: '0.2s' }}>
        {queue.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
            🎉 No pending verifications!
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Worker</th>
                <th>Category</th>
                <th>ID Document</th>
                <th>Certificate</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((w) => (
                <tr key={w.id}>
                  <td>{w.name}</td>
                  <td>{w.trade_category}</td>
                  <td>
                    <a href={w.id_card_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)' }}>
                      View ID 📄
                    </a>
                  </td>
                  <td>
                    {w.certificate_url ? (
                      <a href={w.certificate_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)' }}>
                        View Cert 📜
                      </a>
                    ) : 'N/A'}
                  </td>
                  <td>
                    <button 
                      className="action-btn" 
                      style={{ background: '#10b981' }}
                      onClick={() => approveWorker(w.id)}
                    >
                      Approve ✅
                    </button>
                    <button className="action-btn reject" style={{ marginLeft: '0.5rem' }}>
                      Reject ❌
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
