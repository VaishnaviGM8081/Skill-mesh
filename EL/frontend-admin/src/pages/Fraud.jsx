import React, { useState } from 'react';

export default function Fraud() {
  const [liveTestResult, setLiveTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testFraudAPI = async () => {
    setLoading(true);
    try {
      // Notice how we use /ml/ which gets proxied to the FastAPI server at port 8000
      const response = await fetch('/ml/detect-fraud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_age_days: 2,
          failed_jobs: 4,
          pricing_deviation: 55.5,
          report_count: 3,
          location_changes: 5,
          suspicious_activity_score: 85.0
        })
      });
      const data = await response.json();
      setLiveTestResult(data);
    } catch (error) {
      console.error("Error fetching ML API:", error);
    }
    setLoading(false);
  };

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

      <div className="glass-panel" style={{ animationDelay: '0.4s', marginTop: '2rem' }}>
        <h2>Live ML Backend Integration Test</h2>
        <p>Click below to send a live mock payload to the Python FastAPI backend.</p>
        <button 
          className="action-btn" 
          onClick={testFraudAPI} 
          disabled={loading}
          style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', background: 'var(--primary)', color: '#fff' }}
        >
          {loading ? 'Analyzing with XGBoost...' : 'Run Live Fraud Detection API'}
        </button>

        {liveTestResult && (
          <div style={{ marginTop: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
            <h3 style={{ color: liveTestResult.is_fraudulent ? '#ef4444' : '#10b981' }}>
              Risk Level: {liveTestResult.risk_level}
            </h3>
            <p><strong>Fraud Probability:</strong> {(liveTestResult.fraud_probability * 100).toFixed(2)}%</p>
            <div>
              <strong>Explainable Reasons:</strong>
              <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                {liveTestResult.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
