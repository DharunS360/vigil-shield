import React from 'react';

interface MITREMatrixProps {
  alerts: any[];
}

const MITRE_TECHNIQUES = [
  { id: 'T1110', name: 'Brute Force', tactic: 'Credential Access' },
  { id: 'T1059', name: 'Command & Scripting', tactic: 'Execution' },
  { id: 'T1003', name: 'Credential Dumping', tactic: 'Credential Access' },
  { id: 'T1021', name: 'Remote Services', tactic: 'Lateral Movement' },
  { id: 'T1041', name: 'Exfil Over C2', tactic: 'Exfiltration' },
  { id: 'T1071', name: 'App Layer Protocol', tactic: 'Command & Control' },
  { id: 'T1053', name: 'Scheduled Task', tactic: 'Persistence' },
  { id: 'T1562', name: 'Impair Defenses', tactic: 'Defense Evasion' },
  { id: 'T1486', name: 'Data Encrypted', tactic: 'Impact' },
  { id: 'T1190', name: 'Exploit Public App', tactic: 'Initial Access' },
  { id: 'T1566', name: 'Phishing', tactic: 'Initial Access' },
  { id: 'T1078', name: 'Valid Accounts', tactic: 'Defense Evasion' },
];

const MITREMatrix: React.FC<MITREMatrixProps> = ({ alerts }) => {
  const getAlertCount = (techniqueId: string) => {
    return alerts.filter((a: any) => {
      const tech = a.mitre_technique || a.mitre || '';
      const sig = a.signature || '';
      return tech.includes(techniqueId) || sig.includes(techniqueId);
    }).length;
  };

  const getColor = (count: number) => {
    if (count === 0) return '#1e293b';
    if (count < 2) return '#3b82f6';
    if (count < 5) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '10px',
      }}
    >
      {MITRE_TECHNIQUES.map((tech) => {
        const count = getAlertCount(tech.id);
        return (
          <div
            key={tech.id}
            style={{
              background: getColor(count),
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color: '#fff',
                fontWeight: 'bold',
                opacity: 0.9,
              }}
            >
              {tech.id}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: '#fff',
                marginTop: '4px',
                fontWeight: 500,
              }}
            >
              {tech.name}
            </div>
            <div
              style={{
                fontSize: '10px',
                color: '#fff',
                opacity: 0.7,
                marginTop: '2px',
              }}
            >
              {tech.tactic}
            </div>
            <div
              style={{
                fontSize: '20px',
                color: '#fff',
                fontWeight: 'bold',
                marginTop: '8px',
              }}
            >
              {count}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MITREMatrix;