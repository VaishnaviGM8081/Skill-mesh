import React from 'react';

export default function Verification() {
  const queue = [
    { worker: 'Manish T.', trade: 'Electrician', upload: 'Wiring Demo.mp4', level: 'Unverified' },
    { worker: 'David R.', trade: 'Plumber', upload: 'Pipe Fixing.mp4', level: 'Bronze' }
  ];

  return (
    <>
      <header className="page-header">
        <h1>Trust Verifications</h1>
        <p>Review and assign skill badges to tradespeople</p>
      </header>

      <div className="glass-panel" style={{ animationDelay: '0.2s' }}>
        <table>
          <thead>
            <tr>
              <th>Tradesperson</th>
              <th>Category</th>
              <th>Current Tier</th>
              <th>Video Proof</th>
              <th>Evaluate Badge</th>
            </tr>
          </thead>
          <tbody>
            {queue.map((v, i) => (
              <tr key={i}>
                <td>{v.worker}</td>
                <td>{v.trade}</td>
                <td>
                  <span className={v.level === 'Unverified' ? 'status-badge danger' : 'status-badge warning'}>
                    {v.level}
                  </span>
                </td>
                <td>
                  <a href="#" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>▶ {v.upload}</a>
                </td>
                <td style={{ display: 'flex', gap: '0.5rem' }}>
                   <button className="action-btn" style={{ background: '#f59e0b' }}>Award Gold</button>
                   <button className="action-btn" style={{ background: '#94a3b8' }}>Award Silver</button>
                   <button className="action-btn" style={{ background: '#b45309' }}>Award Bronze</button>
                   <button className="action-btn reject">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
