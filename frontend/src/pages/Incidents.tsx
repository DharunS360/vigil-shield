import React, { useEffect, useState } from 'react';
import { incidentsApi } from '../api/client';
import axios from 'axios';

interface Incident {
  id: number;
  title: string;
  description: string;
  severity: string;
  risk_score: number;
  mitre_technique: string;
  src_ip: string;
  alert_count: number;
  status: string;
  created_at: string;
}

const Incidents: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [correlating, setCorrelating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const response = await incidentsApi.getAll();
      setIncidents(response.data.data || []);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const runCorrelation = async () => {
    setCorrelating(true);
    setMessage('');
    try {
      const response = await axios.get('http://localhost:8000/api/v1/correlate');
      console.log('Correlation response:', response.data);
      
      if (response.data && response.data.data) {
        setIncidents(response.data.data);
      }
      
      setMessage('✅ Correlation completed! ' + (response.data.incidents_created || 0) + ' incidents created.');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error running correlation:', error);
      setMessage('❌ Correlation failed!');
    } finally {
      setCorrelating(false);
    }
  };

  const updateIncidentStatus = async (incidentId: number, newStatus: string) => {
    try {
      const response = await axios.put(
        'http://localhost:8000/api/v1/incidents/' + incidentId + '?status=' + newStatus
      );
      
      if (response.data) {
        // Update local state
        setIncidents(prevIncidents =>
          prevIncidents.map(incident =>
            incident.id === incidentId
              ? { ...incident, status: newStatus }
              : incident
          )
        );
        
        setMessage('✅ Incident #' + incidentId + ' updated to ' + newStatus);
        setTimeout(() => setMessage(''), 3000);
        fetchIncidents();
      }
    } catch (error) {
      console.error('Error updating incident:', error);
      setMessage('❌ Failed to update incident #' + incidentId);
      setTimeout(() => setMessage(''), 3000);
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

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      open: { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' },
      investigating: { bg: 'rgba(249, 115, 22, 0.2)', text: '#f97316' },
      resolved: { bg: 'rgba(34, 197, 94, 0.2)', text: '#22c55e' },
      false_positive: { bg: 'rgba(107, 114, 128, 0.2)', text: '#6b7280' },
    };
    return colors[status] || colors.open;
  };

  const filteredIncidents = filter === 'all'
    ? incidents
    : incidents.filter(i => i.status === filter);

  if (loading) {
    return <div className="loading">Loading incidents...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">🚨 Incidents</h1>
          <p className="page-subtitle">Security incidents from correlation engine</p>
        </div>
        <button
          onClick={runCorrelation}
          disabled={correlating}
          style={{
            backgroundColor: correlating ? '#64748b' : '#2563eb',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: correlating ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {correlating ? '⏳ Running...' : '🔄 Run Correlation'}
        </button>
      </div>

      {message && (
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          background: message.includes('✅') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: '1px solid ' + (message.includes('✅') ? '#22c55e' : '#ef4444'),
          color: message.includes('✅') ? '#22c55e' : '#ef4444',
          marginBottom: '16px'
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['all', 'open', 'investigating', 'resolved', 'false_positive'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: filter === s ? '2px solid #3b82f6' : '1px solid #1e2a45',
              background: filter === s ? '#1e293b' : 'transparent',
              color: filter === s ? 'white' : '#8a96b8',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: '14px' }}>
          {filteredIncidents.length} incidents
        </span>
      </div>

      {filteredIncidents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <p style={{ color: '#8a96b8', fontSize: '18px', margin: 0 }}>No incidents found</p>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>
            Click "Run Correlation" to analyze alerts
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {filteredIncidents.map((incident) => {
            const statusBadge = getStatusBadge(incident.status);
            return (
              <div
                key={incident.id}
                className="card"
                style={{
                  transition: 'all 0.2s',
                  borderLeft: '4px solid ' + statusBadge.text
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <h3 style={{ color: 'white', margin: 0, fontSize: '16px' }}>{incident.title}</h3>
                      <span className={'severity-badge ' + getSeverityBadge(incident.severity)}>
                        {incident.severity}
                      </span>
                      <span style={{
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        background: statusBadge.bg,
                        color: statusBadge.text,
                        textTransform: 'capitalize'
                      }}>
                        {incident.status}
                      </span>
                    </div>
                    <p style={{ color: '#8a96b8', fontSize: '14px', margin: '4px 0' }}>
                      {incident.description}
                    </p>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '13px', flexWrap: 'wrap' }}>
                      <span style={{ color: '#64748b' }}>🎯 MITRE: <span style={{ color: '#60a5fa' }}>{incident.mitre_technique}</span></span>
                      <span style={{ color: '#64748b' }}>📊 Risk Score: <span style={{ color: '#f59e0b' }}>{incident.risk_score}/100</span></span>
                      <span style={{ color: '#64748b' }}>📁 Alerts: <span style={{ color: 'white' }}>{incident.alert_count}</span></span>
                      <span style={{ color: '#64748b' }}>🌐 Source: <span style={{ color: 'white' }}>{incident.src_ip}</span></span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', color: '#64748b', fontSize: '12px', minWidth: '120px' }}>
                    {new Date(incident.created_at).toLocaleString()}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #1e2a45' }}>
                  <button
                    onClick={() => updateIncidentStatus(incident.id, 'investigating')}
                    style={{
                      background: 'rgba(249, 115, 22, 0.1)',
                      color: '#f97316',
                      padding: '6px 16px',
                      borderRadius: '6px',
                      border: '1px solid #f97316',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    🔍 Investigating
                  </button>
                  <button
                    onClick={() => updateIncidentStatus(incident.id, 'resolved')}
                    style={{
                      background: 'rgba(34, 197, 94, 0.1)',
                      color: '#22c55e',
                      padding: '6px 16px',
                      borderRadius: '6px',
                      border: '1px solid #22c55e',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    ✅ Resolved
                  </button>
                  <button
                    onClick={() => updateIncidentStatus(incident.id, 'false_positive')}
                    style={{
                      background: 'rgba(107, 114, 128, 0.1)',
                      color: '#6b7280',
                      padding: '6px 16px',
                      borderRadius: '6px',
                      border: '1px solid #6b7280',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    ⚠️ False Positive
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Incidents;