import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import Incidents from './pages/Incidents';
import Settings from './pages/Settings';
import AlertDetails from './pages/AlertDetails';

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <div className="navbar-brand">
            <h1>🛡️ VigilShield SIEM</h1>
            <div className="navbar-links">
              <Link to="/">Dashboard</Link>
              <Link to="/alerts">Alerts</Link>
              <Link to="/incidents">🚨 Incidents</Link>
              <Link to="/settings">⚙️ Settings</Link>
            </div>
          </div>
          <div className="navbar-status">🟢 System Online</div>
        </nav>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/alerts/:id" element={<AlertDetails />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;