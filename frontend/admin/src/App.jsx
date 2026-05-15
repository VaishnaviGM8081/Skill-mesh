import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Scale, AlertOctagon, UserCheck, Map } from 'lucide-react';

import Overview from './pages/Overview';
import Disputes from './pages/Disputes';
import Fraud from './pages/Fraud';
import Verification from './pages/Verification';
import UsersPage from './pages/Users';
import OperationsMap from './pages/OperationsMap';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <aside className="sidebar">
          <div className="logo-section">
            <LayoutDashboard className="icon" size={28} />
            <span>SkillMesh</span>
          </div>
          
          <nav>
            <NavLink to="/" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} /> Dashboard
            </NavLink>
            <NavLink to="/map" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Map size={20} /> Operations Map
            </NavLink>
            <NavLink to="/users" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <UserCheck size={20} /> User Directory
            </NavLink>
            <NavLink to="/verify" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <UserCheck size={20} /> Verification
            </NavLink>
            <NavLink to="/disputes" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Scale size={20} /> Dispute Queue
            </NavLink>
            <NavLink to="/fraud" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <AlertOctagon size={20} /> Fraud Engine
            </NavLink>
          </nav>
        </aside>

        <main className="main-content">
          <Suspense fallback={<div style={{color: 'white', padding: '2rem'}}>Loading Dashboard...</div>}>
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/map" element={<OperationsMap />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/disputes" element={<Disputes />} />
              <Route path="/fraud" element={<Fraud />} />
              <Route path="/verify" element={<Verification />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
