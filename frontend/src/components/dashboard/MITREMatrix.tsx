import React from 'react';

interface MitreTechnique {
  id: string;
  name: string;
  tactic: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

const mitreData: MitreTechnique[] = [
  { id: 'T1046', name: 'Network Service Scanning', tactic: 'Reconnaissance', severity: 'medium' },
  { id: 'T1110', name: 'Brute Force', tactic: 'Credential Access', severity: 'high' },
  { id: 'T1190', name: 'Exploit Public-Facing Application', tactic: 'Initial Access', severity: 'critical' },
  { id: 'T1071', name: 'Application Layer Protocol', tactic: 'Command and Control', severity: 'high' },
  { id: 'T1486', name: 'Data Encrypted for Impact', tactic: 'Impact', severity: 'critical' },
  { id: 'T1595', name: 'Active Scanning', tactic: 'Reconnaissance', severity: 'medium' },
  { id: 'T1059', name: 'Command and Scripting Interpreter', tactic: 'Execution', severity: 'high' },
  { id: 'T1086', name: 'PowerShell', tactic: 'Execution', severity: 'medium' },
];

const getSeverityColor = (severity: string) => {
  const colors = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e'
  };
  return colors[severity as keyof typeof colors] || '#64748b';
};

const getSeverityText = (severity: string) => {
  const texts = {
    critical: '🔴 Critical',
    high: '🟠 High',
    medium: '🟡 Medium',
    low: '🟢 Low'
  };
  return texts[severity as keyof typeof texts] || severity;
};

const MITREMatrix: React.FC = () => {
  return (
    <div>
      <h3 className="card-title">🎯 MITRE ATT&CK Matrix</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px' }}>
          <thead>
            <tr>
              <th style={{ padding: '8px', color: '#8a96b8', fontSize: '12px', textAlign: 'left', borderBottom: '1px solid #1e2a45' }}>Tactic</th>
              <th style={{ padding: '8px', color: '#8a96b8', fontSize: '12px', textAlign: 'left', borderBottom: '1px solid #1e2a45' }}>Technique</th>
              <th style={{ padding: '8px', color: '#8a96b8', fontSize: '12px', textAlign: 'left', borderBottom: '1px solid #1e2a45' }}>ID</th>
              <th style={{ padding: '8px', color: '#8a96b8', fontSize: '12px', textAlign: 'left', borderBottom: '1px solid #1e2a45' }}>Severity</th>
            </tr>
          </thead>
          <tbody>
            {mitreData.map((tech) => (
              <tr key={tech.id} style={{ borderBottom: '1px solid #1e2a45' }}>
                <td style={{ padding: '8px', color: '#8a96b8', fontSize: '13px' }}>{tech.tactic}</td>
                <td style={{ padding: '8px', color: 'white', fontSize: '13px' }}>{tech.name}</td>
                <td style={{ padding: '8px', color: '#60a5fa', fontSize: '13px', fontFamily: 'monospace' }}>{tech.id}</td>
                <td style={{ padding: '8px' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: getSeverityColor(tech.severity),
                    background: getSeverityColor(tech.severity) + '20',
                    border: '1px solid ' + getSeverityColor(tech.severity)
                  }}>
                    {getSeverityText(tech.severity)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MITREMatrix;
