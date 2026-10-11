import React, { useEffect, useState } from 'react';
import { alertsApi } from '../api/client';
import { Link } from 'react-router-dom';

interface Alert {
  id: number;
  timestamp: string;
  src_ip: string;
  dst_ip: string;
  src_port: number;
  dst_port: number;
  protocol: string;
  signature: string;
  severity: string;
  category: string;
  source_type: string;
}

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await alertsApi.getAll();
      setAlerts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'severity-critical',
      high: 'severity-high',
      medium: 'severity-medium',
      low: 'severity-low',
    };
    return colors[severity] || '';
  };

  const getSeverityText = (severity: string) => {
    const map: Record<string, string> = {
      '1': 'Low',
      '2': 'Medium',
      '3': 'High',
      '4': 'Critical',
    };
    return map[severity] || severity;
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.signature.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          alert.src_ip.includes(searchTerm) ||
                          alert.dst_ip.includes(searchTerm);
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  if (loading) {
    return <div className="loading">Loading alerts...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">🚨 Alerts</h1>
          <p className="page-subtitle">All security alerts with detailed information</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="🔍 Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              backgroundColor: '#141b2d',
              border: '1px solid #1e2a45',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              outline: 'none',
              width: '250px'
            }}
          />
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            style={{
              backgroundColor: '#141b2d',
              border: '1px solid #1e2a45',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              outline: 'none'
            }}
          >
            <option value="all">All Severities</option>
            <option value="critical">🔴 Critical</option>
            <option value="high">🟠 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '12px', color: '#64748b', fontSize: '14px' }}>
        Showing {filteredAlerts.length} of {alerts.length} alerts
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Source</th>
              <th>Destination</th>
              <th>Signature</th>
              <th>Severity</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlerts.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#8a96b8', padding: '40px' }}>
                  🔍 No alerts found matching your criteria
                </td>
              </tr>
            ) : (
              filteredAlerts.map((alert) => (
                <tr key={alert.id} style={{ borderBottom: '1px solid #1e2a45' }}>
                  <td style={{ padding: '12px', color: '#8a96b8', fontSize: '13px' }}>
                    {new Date(alert.timestamp).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ color: 'white', fontFamily: 'monospace', fontSize: '13px' }}>{alert.src_ip}</div>
                    <div style={{ color: '#64748b', fontSize: '11px' }}>Port: {alert.src_port || 'N/A'}</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ color: 'white', fontFamily: 'monospace', fontSize: '13px' }}>{alert.dst_ip || 'N/A'}</div>
                    <div style={{ color: '#64748b', fontSize: '11px' }}>Port: {alert.dst_port || 'N/A'} | {alert.protocol || 'N/A'}</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ color: 'white', fontSize: '13px' }}>{alert.signature}</div>
                    <div style={{ color: '#64748b', fontSize: '11px' }}>Category: {alert.category || 'Unknown'} | Source: {alert.source_type || 'Unknown'}</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span className={'severity-badge ' + getSeverityBadge(alert.severity)}>
                      {getSeverityText(alert.severity)}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Link
                      to={'/alerts/' + alert.id}
                      style={{
                        color: '#3b82f6',
                        textDecoration: 'none',
                        fontSize: '13px'
                      }}
                    >
                      View Details →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Alerts;
