import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { alertsApi } from '../api/client';

interface AlertDetail {
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
  mitre_technique: string;
  source_type: string;
  risk_score: number;
  status: string;
}

const AlertDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [alert, setAlert] = useState<AlertDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => { fetchAlert(); }, [id]);

  const fetchAlert = async () => {
    try {
      const response = await alertsApi.getById(Number(id));
      setAlert(response.data.data);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const calculateRiskScore = (alert: AlertDetail) => {
    const scores: Record<string, number> = { critical: 95, high: 80, medium: 50, low: 25 };
    return scores[alert.severity] || 25;
  };

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const updateStatus = async (newStatus: string, successMessage: string) => {
    try {
      const response = await alertsApi.updateStatus(Number(id), newStatus);
      if (response.data.status === 'success') {
        showMessage(successMessage);
        setAlert(prev => prev ? { ...prev, status: newStatus } : null);
        fetchAlert();
      }
    } catch (error) {
      console.error('Error:', error);
      showMessage('❌ Failed to update status');
    }
  };

  const handleInvestigate = () => updateStatus('investigating', '🔍 Investigation started');
  const handleResolve = () => { if (window.confirm('Resolve?')) updateStatus('resolved', '✅ Resolved!'); };
  const handleFalsePositive = () => { if (window.confirm('False Positive?')) updateStatus('false_positive', '⚠️ Marked FP'); };
  const handleAddNote = () => {
    if (note.trim()) { showMessage('📝 Note added'); setNote(''); }
    else showMessage('⚠️ Enter a note');
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      critical: { bg: 'rgba(239,68,68,0.2)', text: '#ef4444', border: '#ef4444' },
      high: { bg: 'rgba(249,115,22,0.2)', text: '#f97316', border: '#f97316' },
      medium: { bg: 'rgba(234,179,8,0.2)', text: '#eab308', border: '#eab308' },
      low: { bg: 'rgba(34,197,94,0.2)', text: '#22c55e', border: '#22c55e' },
    };
    return colors[severity] || colors.medium;
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!alert) return <div style={{ padding: '24px', color: 'white' }}>Alert not found</div>;

  const severityStyle = getSeverityBadge(alert.severity);
  const riskScore = alert.risk_score || calculateRiskScore(alert);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link to="/alerts" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '18px' }}>←</Link>
        <h1 className="page-title" style={{ margin: 0 }}>🔍 Alert Details</h1>
        <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: '14px' }}>Alert ID: #{alert.id}</span>
      </div>

      {message && (
        <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', border: '1px solid #3b82f6', color: '#60a5fa', marginBottom: '16px' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gap: '16px' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h3 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '20px' }}>{alert.signature}</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 14px', borderRadius: '20px', background: severityStyle.bg, color: severityStyle.text, fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', border: '1px solid ' + severityStyle.border }}>
                  {alert.severity}
                </span>
                <span style={{ padding: '4px 14px', borderRadius: '20px', background: 'rgba(59,130,246,0.2)', color: '#60a5fa', fontSize: '13px' }}>
                  📂 {alert.category || 'N/A'}
                </span>
                <span style={{ padding: '4px 14px', borderRadius: '20px', background: 'rgba(34,197,94,0.2)', color: '#22c55e', fontSize: '13px' }}>
                  📊 Risk: {riskScore}/100
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right', color: '#64748b', fontSize: '13px' }}>
              {new Date(alert.timestamp).toLocaleString()}
              <div style={{ fontSize: '11px', marginTop: '4px' }}>
                Status: <span style={{
                  color: alert.status === 'investigating' ? '#f59e0b' :
                         alert.status === 'resolved' ? '#22c55e' :
                         alert.status === 'false_positive' ? '#ef4444' : '#64748b',
                  fontWeight: 'bold'
                }}>{alert.status || 'new'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h4 style={{ color: '#8a96b8', marginBottom: '16px' }}>🌐 Network Details</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'rgba(30,42,69,0.3)', padding: '12px', borderRadius: '8px' }}>
              <p style={{ color: '#64748b', fontSize: '11px', margin: 0 }}>SOURCE IP</p>
              <p style={{ color: 'white', fontFamily: 'monospace', margin: '4px 0 0 0' }}>{alert.src_ip}</p>
              <p style={{ color: '#64748b', fontSize: '12px', margin: '2px 0 0 0' }}>Port: {alert.src_port || 'N/A'}</p>
            </div>
            <div style={{ background: 'rgba(30,42,69,0.3)', padding: '12px', borderRadius: '8px' }}>
              <p style={{ color: '#64748b', fontSize: '11px', margin: 0 }}>DESTINATION IP</p>
              <p style={{ color: 'white', fontFamily: 'monospace', margin: '4px 0 0 0' }}>{alert.dst_ip || 'N/A'}</p>
              <p style={{ color: '#64748b', fontSize: '12px', margin: '2px 0 0 0' }}>Port: {alert.dst_port || 'N/A'}</p>
            </div>
            <div style={{ background: 'rgba(30,42,69,0.3)', padding: '12px', borderRadius: '8px' }}>
              <p style={{ color: '#64748b', fontSize: '11px', margin: 0 }}>PROTOCOL</p>
              <p style={{ color: 'white', fontFamily: 'monospace', margin: '4px 0 0 0' }}>{alert.protocol || 'N/A'}</p>
            </div>
            <div style={{ background: 'rgba(30,42,69,0.3)', padding: '12px', borderRadius: '8px' }}>
              <p style={{ color: '#64748b', fontSize: '11px', margin: 0 }}>SOURCE TYPE</p>
              <p style={{ color: 'white', fontFamily: 'monospace', margin: '4px 0 0 0' }}>{alert.source_type || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h4 style={{ color: '#8a96b8', marginBottom: '12px' }}>📝 Add Note</h4>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Enter note..." style={{ flex: 1, background: '#0a0e1a', color: 'white', padding: '10px 14px', borderRadius: '8px', border: '1px solid #1e2a45', outline: 'none' }} />
            <button onClick={handleAddNote} style={{ background: '#2563eb', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>➕ Add</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={handleInvestigate} style={{ background: '#2563eb', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>🔍 Investigate</button>
          <button onClick={handleResolve} style={{ background: 'transparent', color: '#22c55e', padding: '10px 20px', borderRadius: '8px', border: '1px solid #22c55e', cursor: 'pointer' }}>✅ Resolve</button>
          <button onClick={handleFalsePositive} style={{ background: 'transparent', color: '#ef4444', padding: '10px 20px', borderRadius: '8px', border: '1px solid #ef4444', cursor: 'pointer' }}>⚠️ False Positive</button>
        </div>
      </div>
    </div>
  );
};

export default AlertDetails;
