import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [statusMessage, setStatusMessage] = useState('');

  const handleSave = () => {
    setStatusMessage('✅ Settings saved successfully!');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  return (
    <div style={{ padding: '24px', minHeight: '100vh' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ Settings</h1>
          <p className="page-subtitle">Configure your VigilShield SIEM</p>
        </div>
        <button
          onClick={handleSave}
          style={{
            backgroundColor: '#22c55e',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          💾 Save Settings
        </button>
      </div>

      {statusMessage && (
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid #22c55e',
          color: '#22c55e',
          marginBottom: '16px'
        }}>
          {statusMessage}
        </div>
      )}

      <div style={{ display: 'grid', gap: '16px' }}>
        <div className="card">
          <h3 className="card-title">🎨 Appearance</h3>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Theme:</span>
            <button
              onClick={() => toggleTheme('dark')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: theme === 'dark' ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                background: theme === 'dark' ? '#1e293b' : 'var(--bg-card)',
                color: theme === 'dark' ? 'white' : 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              🌙 Dark
            </button>
            <button
              onClick={() => toggleTheme('light')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: theme === 'light' ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                background: theme === 'light' ? '#e0e0e0' : 'var(--bg-card)',
                color: theme === 'light' ? '#1a1a2e' : 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              ☀️ Light
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">🔔 Notifications</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Enable notifications</span>
            <button
              onClick={() => setNotifications(!notifications)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                border: 'none',
                background: notifications ? '#22c55e' : '#ef4444',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {notifications ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">🔄 Auto Refresh</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Enable auto-refresh</span>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  background: autoRefresh ? '#22c55e' : '#ef4444',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {autoRefresh ? 'ON' : 'OFF'}
              </button>
            </div>
            {autoRefresh && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Refresh interval:</span>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  style={{
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <option value={15}>15 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={300}>5 minutes</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">ℹ️ About VigilShield SIEM</h3>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.8' }}>
            <p><strong style={{ color: 'var(--text-primary)' }}>Version:</strong> 1.0.0</p>
            <p><strong style={{ color: 'var(--text-primary)' }}>Built:</strong> React + FastAPI + SQLite</p>
            <p><strong style={{ color: 'var(--text-primary)' }}>Description:</strong> Enterprise SIEM Solution</p>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">🖥️ System Status</h3>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Backend:</span>
              <span style={{ color: '#22c55e', marginLeft: '8px' }}>🟢 Online</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Database:</span>
              <span style={{ color: '#22c55e', marginLeft: '8px' }}>🟢 Connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;