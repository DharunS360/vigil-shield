import React, { useEffect, useState } from 'react';
import { alertsApi } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import SummaryCard from '../components/dashboard/SummaryCard';
import MITREMatrix from '../components/dashboard/MITREMatrix';
import { useWebSocket } from '../hooks/useWebSocket';

interface Stats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface Alert {
  id: number;
  timestamp: string;
  src_ip: string;
  dst_ip: string;
  signature: string;
  severity: string;
  category?: string;
  source_type?: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // WebSocket connection
  const { messages, isConnected } = useWebSocket('ws://localhost:8000/ws/alerts');

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
      console.log('🔄 Auto-refresh triggered');
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[0];
      console.log('📩 WebSocket message received:', lastMessage);
      // Refresh data when new message arrives
      fetchData();
    }
  }, [messages]);

  const fetchData = async () => {
    try {
      const statsResponse = await alertsApi.getStats();
      setStats(statsResponse.data.data);

      const alertsResponse = await alertsApi.getAll();
      const allAlerts = alertsResponse.data.data || [];
      setAlerts(allAlerts);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const handleGenerateReport = () => {
    const attackTypes = getAttackTypes();
    const topSources = getTopSources();
    
    const report = {
      reportInfo: {
        title: 'VigilShield SIEM Security Report',
        generatedAt: new Date().toISOString(),
        version: '1.0.0'
      },
      summary: {
        totalAlerts: stats?.total || 0,
        critical: stats?.critical || 0,
        high: stats?.high || 0,
        medium: stats?.medium || 0,
        low: stats?.low || 0,
        incidents: 3,
        threatsDetected: (stats?.critical || 0) + (stats?.high || 0)
      },
      topAttacks: attackTypes.slice(0, 5),
      topSources: topSources.slice(0, 5),
      recentAlerts: alerts.slice(0, 10).map(a => ({
        time: new Date(a.timestamp).toLocaleString(),
        source: a.src_ip,
        destination: a.dst_ip || 'N/A',
        signature: a.signature,
        severity: a.severity
      })),
      recommendations: [
        'Review critical and high severity alerts immediately',
        'Investigate top attack sources for potential threats',
        'Update correlation rules based on recent patterns'
      ]
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'VigilShield_Report_' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getAttackTypes = () => {
    const attackMap: Record<string, number> = {};
    alerts.forEach(alert => {
      const sig = alert.signature || 'Unknown';
      attackMap[sig] = (attackMap[sig] || 0) + 1;
    });
    return Object.entries(attackMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ 
        name: name.length > 30 ? name.substring(0, 30) + '...' : name, 
        count 
      }));
  };

  const getTopSources = () => {
    const ipMap: Record<string, number> = {};
    alerts.forEach(alert => {
      ipMap[alert.src_ip] = (ipMap[alert.src_ip] || 0) + 1;
    });
    return Object.entries(ipMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([ip, count]) => ({ ip, count }));
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  const severityData = stats ? [
    { name: 'Critical', value: stats.critical || 0 },
    { name: 'High', value: stats.high || 0 },
    { name: 'Medium', value: stats.medium || 0 },
    { name: 'Low', value: stats.low || 0 },
  ] : [];

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e'];

  const timeData = [
    { time: '00:00', alerts: 12 },
    { time: '04:00', alerts: 8 },
    { time: '08:00', alerts: 25 },
    { time: '12:00', alerts: 18 },
    { time: '16:00', alerts: 30 },
    { time: '20:00', alerts: 15 },
    { time: '24:00', alerts: 10 },
  ];

  const processingRateData = timeData.map(d => ({
    time: d.time,
    eps: Math.floor(d.alerts / 2) + Math.floor(Math.random() * 5)
  }));

  const attackTypes = getAttackTypes();
  const topSources = getTopSources();
  const recentAlerts = alerts.slice(0, 5);

  const getSeverityClass = (severity: string) => {
    const classes: Record<string, string> = {
      critical: 'severity-critical',
      high: 'severity-high',
      medium: 'severity-medium',
      low: 'severity-low',
    };
    return classes[severity] || '';
  };

  const severityText = (severity: string) => {
    const map: Record<string, string> = {
      '1': 'Low',
      '2': 'Medium', 
      '3': 'High',
      '4': 'Critical',
    };
    return map[severity] || severity;
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Logo */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px', 
        marginBottom: '24px',
        background: 'linear-gradient(135deg, #0d1b2a, #1b2d4a)',
        padding: '16px 24px',
        borderRadius: '16px',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          background: 'linear-gradient(145deg, #2563eb, #7c3aed)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          boxShadow: '0 4px 20px rgba(37, 99, 235, 0.5)',
          flexShrink: 0
        }}>
          <span style={{ position: 'relative' }}>
            👁️
            <span style={{ position: 'absolute', top: '-6px', right: '-10px', fontSize: '18px' }}>🛡️</span>
          </span>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ 
              color: 'white', 
              fontSize: '22px', 
              fontWeight: '800', 
              margin: 0,
              background: 'linear-gradient(90deg, #60a5fa, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>VIGILSHIELD</h1>
            <span style={{
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              color: 'white',
              fontSize: '9px',
              fontWeight: '700',
              padding: '2px 10px',
              borderRadius: '20px',
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>SIEM</span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '11px', margin: '2px 0 0 0', letterSpacing: '2.5px' }}>
            ⚡ ALWAYS WATCHING · ALWAYS PROTECTING ⚡
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isConnected ? '#22c55e' : '#ef4444',
            display: 'inline-block'
          }}></span>
          <span style={{ color: isConnected ? '#22c55e' : '#ef4444', fontSize: '12px', fontWeight: '500' }}>
            {isConnected ? '🟢 Live' : '🔴 Offline'}
          </span>
          <span style={{ color: '#64748b', fontSize: '12px' }}>|</span>
          <span style={{ color: '#64748b', fontSize: '12px' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Dashboard</h1>
          <p className="page-subtitle">Real-time security monitoring</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              backgroundColor: '#1e293b',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #1e2a45',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              opacity: refreshing ? 0.6 : 1
            }}
          >
            {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
          </button>
          <button 
            onClick={handleGenerateReport}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            📄 + Generate Report
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <SummaryCard title="Total Events" value={stats?.total || 0} icon="📊" color="#3b82f6" />
        <SummaryCard title="Threats Detected" value={(stats?.high || 0) + (stats?.critical || 0)} icon="⚠️" color="#ef4444" />
        <SummaryCard title="Log Processing Rate" value="42 EPS" subtitle="Events per second" icon="⚡" color="#8b5cf6" />
        <SummaryCard title="Top Classification" value={attackTypes[0]?.name || 'N/A'} subtitle={(attackTypes[0]?.count || 0) + ' events'} icon="📁" color="#f59e0b" />
        <SummaryCard title="Active Threats" value="2" icon="🔥" color="#ef4444" />
        <SummaryCard title="Total Incidents" value="12" subtitle="Open: 8, Resolved: 4" icon="🎯" color="#22c55e" />
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stats-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div><p className="stats-card-title">📊 Total Alerts</p><p className="stats-card-value">{stats?.total || 0}</p></div>
        </div>
        <div className="stats-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div><p className="stats-card-title">🔴 Critical</p><p className="stats-card-value">{stats?.critical || 0}</p></div>
        </div>
        <div className="stats-card" style={{ borderLeft: '4px solid #f97316' }}>
          <div><p className="stats-card-title">🟠 High</p><p className="stats-card-value">{stats?.high || 0}</p></div>
        </div>
        <div className="stats-card" style={{ borderLeft: '4px solid #eab308' }}>
          <div><p className="stats-card-title">🟡 Medium</p><p className="stats-card-value">{stats?.medium || 0}</p></div>
        </div>
        <div className="stats-card" style={{ borderLeft: '4px solid #22c55e' }}>
          <div><p className="stats-card-title">🟢 Low</p><p className="stats-card-value">{stats?.low || 0}</p></div>
        </div>
      </div>

      {/* Charts */}
      <div className="dashboard-grid" style={{ marginTop: '24px' }}>
        <div className="card">
          <h3 className="card-title">📈 Alerts Over Time (Last 24 Hours)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a45" />
              <XAxis dataKey="time" stroke="#8a96b8" />
              <YAxis stroke="#8a96b8" />
              <Tooltip contentStyle={{ backgroundColor: '#141b2d', borderColor: '#1e2a45' }} />
              <Bar dataKey="alerts" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="card-title">🎯 Alerts by Severity</h3>
          {severityData.every(d => d.value === 0) ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8a96b8' }}>
              No severity data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent = 0 }) => name + ' ' + (percent * 100).toFixed(0) + '%'}
                >
                  {severityData.map((entry, index) => (
                    <Cell key={'cell-' + index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#141b2d', borderColor: '#1e2a45' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Log Processing Rate */}
      <div className="dashboard-grid" style={{ marginTop: '24px' }}>
        <div className="card">
          <h3 className="card-title">⚡ Log Processing Rate (EPS)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={processingRateData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a45" />
              <XAxis dataKey="time" stroke="#8a96b8" />
              <YAxis stroke="#8a96b8" />
              <Tooltip contentStyle={{ backgroundColor: '#141b2d', borderColor: '#1e2a45' }} />
              <Area type="monotone" dataKey="eps" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="card-title">🎯 Top Attack Types</h3>
          {attackTypes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8a96b8' }}>
              No attack data available
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {attackTypes.map((attack) => (
                <div key={attack.name} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: 'rgba(30, 42, 69, 0.4)',
                  borderRadius: '8px',
                  border: '1px solid #1e2a45'
                }}>
                  <span style={{ color: 'white', fontSize: '13px' }}>{attack.name}</span>
                  <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>{attack.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Sources + MITRE Matrix */}
      <div className="dashboard-grid" style={{ marginTop: '24px' }}>
        <div className="card">
          <h3 className="card-title">🌐 Top Attack Sources</h3>
          {topSources.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8a96b8' }}>
              No source data available
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topSources.map((source) => (
                <div key={source.ip} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: 'rgba(30, 42, 69, 0.4)',
                  borderRadius: '8px',
                  border: '1px solid #1e2a45'
                }}>
                  <span style={{ color: '#8a96b8', fontFamily: 'monospace' }}>{source.ip}</span>
                  <span style={{ color: '#f97316', fontWeight: 'bold' }}>{source.count} alerts</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <MITREMatrix />
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title">🕐 Recent Alerts</h3>
          <a href="/alerts" style={{ color: '#3b82f6', textDecoration: 'none' }}>View All Alerts →</a>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Source IP</th>
                <th>Destination</th>
                <th>Attack Type</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {recentAlerts.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: '#8a96b8', padding: '20px' }}>
                    No alerts found
                  </td>
                </tr>
              ) : (
                recentAlerts.map((alert) => (
                  <tr key={alert.id} onClick={() => window.location.href = '/alerts/' + alert.id} style={{ cursor: 'pointer' }}>
                    <td>{new Date(alert.timestamp).toLocaleTimeString()}</td>
                    <td>{alert.src_ip}</td>
                    <td>{alert.dst_ip || 'N/A'}</td>
                    <td>{alert.signature}</td>
                    <td>
                      <span className={'severity-badge ' + getSeverityClass(alert.severity)}>
                        {severityText(alert.severity)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
