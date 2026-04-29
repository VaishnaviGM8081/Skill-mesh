import React from 'react';

export default function Fraud() {
  const flags = [
    { worker: 'Sanjay V.', rating: '5', score: '0.89', reason: 'Burst Ratings Event', time: '10 mins ago' },
    { worker: 'Rajesh G.', rating: '1', score: '0.76', reason: 'Same IP Match', time: '1 hr ago' }
  ];

  return (
    <>
      <header className="page-header">
        <h1>Fraud & Anomaly Detection</h1>
        <p>Suspicious ratings surfaced by the ML Isolation Forest model</p>
      </header>

      <div className="glass-panel" style={{ animationDelay: '0.2s' }}>
        <table>
          <thead>
            <tr>
              <th>Worker Profile</th>
              <th>Given Rating</th>
              <th>Risk Score</th>
              <th>Detection Reason</th>
              <th>Time</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {flags.map((f, i) => (
              <tr key={i}>
                <td>{f.worker}</td>
                <td>⭐ {f.rating}.0</td>
                <td><span className="status-badge danger">{f.score}</span></td>
                <td>{f.reason}</td>
                <td style={{color: 'var(--text-muted)'}}>{f.time}</td>
                <td style={{ display: 'flex', gap: '0.5rem' }}>
                   <button className="action-btn reject">Nullify Rating</button>
                   <button className="action-btn">Ignore (Safe)</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
