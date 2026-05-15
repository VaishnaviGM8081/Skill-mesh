import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet + React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function OperationsMap() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bengaluru coordinates
  const position = [12.9716, 77.5946];

  useEffect(() => {
    const fetchActiveJobs = async () => {
      try {
        const res = await fetch('/api/jobs/admin/overview'); // Reusing overview data
        const json = await res.json();
        if (json.success) {
          // Add some random lat/lng for demonstration since our current DB uses pincodes
          const demoJobs = json.data.recentJobs.map((job, i) => ({
            ...job,
            lat: 12.9716 + (Math.random() - 0.5) * 0.1,
            lng: 77.5946 + (Math.random() - 0.5) * 0.1
          }));
          setJobs(demoJobs);
        }
      } catch (e) {
        console.error('Failed to fetch jobs for map', e);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveJobs();
  }, []);

  if (loading) return <div className="loading">Initializing Satellite Data...</div>;

  return (
    <>
      <header className="page-header">
        <h1>Operations Center</h1>
        <p>Live heat-map of active service requests across Bengaluru</p>
      </header>

      <div className="glass-panel" style={{ padding: 0, height: '600px', overflow: 'hidden', position: 'relative' }}>
        <MapContainer center={position} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {jobs.map((job) => (
            <React.Fragment key={job.id}>
              <Marker position={[job.lat, job.lng]}>
                <Popup>
                  <strong>{job.trade_category.toUpperCase()}</strong><br />
                  Status: {job.status}<br />
                  Customer: {job.customer_name}
                </Popup>
              </Marker>
              <Circle 
                center={[job.lat, job.lng]} 
                radius={1000} 
                pathOptions={{ 
                  color: job.status === 'in_progress' ? '#10b981' : '#8b5cf6',
                  fillColor: job.status === 'in_progress' ? '#10b981' : '#8b5cf6',
                  fillOpacity: 0.1 
                }} 
              />
            </React.Fragment>
          ))}
        </MapContainer>

        <div className="map-legend">
          <div className="legend-item">
            <span className="dot" style={{ background: '#10b981' }}></span> Active Now
          </div>
          <div className="legend-item">
            <span className="dot" style={{ background: '#8b5cf6' }}></span> Requested
          </div>
        </div>
      </div>

      <style>{`
        .map-legend {
          position: absolute;
          bottom: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.9);
          padding: 10px;
          border-radius: 8px;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #1A1A2E;
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
      `}</style>
    </>
  );
}
