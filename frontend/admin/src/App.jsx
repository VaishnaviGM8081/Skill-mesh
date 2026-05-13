import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Scale, AlertOctagon, UserCheck } from 'lucide-react';
import Overview from './pages/Overview';
import Disputes from './pages/Disputes';
import Fraud from './pages/Fraud';
import Verification from './pages/Verification';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        {/* Sidebar Navigation */}
        <aside className="sidebar">
          <div className="logo-section">
            <LayoutDashboard className="icon" size={28} />
            <span>SkillMesh</span>
          </div>
          
          <nav>
            <NavLink to="/" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} /> Dashboard
            </NavLink>
            <NavLink to="/disputes" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Scale size={20} /> Dispute Queue
            </NavLink>
            <NavLink to="/fraud" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <AlertOctagon size={20} /> Fraud Engine
            </NavLink>
            <NavLink to="/verify" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <UserCheck size={20} /> Verifications
            </NavLink>
          </nav>
        </aside>

        {/* Dynamic Route Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/disputes" element={<Disputes />} />
            <Route path="/fraud" element={<Fraud />} />
            <Route path="/verify" element={<Verification />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
