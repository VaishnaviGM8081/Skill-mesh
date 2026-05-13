import React from 'react';

export default function Disputes() {
  const disputes = [
    { id: '#8921', customer: 'Ravi Kumar', worker: 'Amit P.', trade: 'Carpenter', status: 'Pending Review', amount: '₹1,500' },
    { id: '#8890', customer: 'Sneha S.', worker: 'Karan M.', trade: 'Painter', status: 'Escalated', amount: '₹4,200' },
  ];

  return (
    <>
      <header className="page-header">
        <h1>Dispute Resolution Queue</h1>
        <p>Review customer and worker evidence for escrow payout decisions</p>
      </header>

      <div className="glass-panel" style={{ animationDelay: '0.2s' }}>
        <table>
          <thead>
            <tr>
              <th>Dispute ID</th>
              <th>Customer</th>
              <th>Worker (Trade)</th>
              <th>Escrow Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {disputes.map((d, i) => (
              <tr key={i}>
                <td>{d.id}</td>
                <td>{d.customer}</td>
                <td>{d.worker} <span style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>({d.trade})</span></td>
                <td>{d.amount}</td>
                <td><span className={d.status === 'Escalated' ? 'status-badge danger' : 'status-badge warning'}>{d.status}</span></td>
                <td style={{ display: 'flex', gap: '0.5rem' }}>
                   <button className="action-btn">View Evidence</button>
                   <button className="action-btn" style={{ background: 'var(--success)' }}>Release to Worker</button>
                   <button className="action-btn reject">Refund Customer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
