import React from 'react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: '#8a96b8', fontSize: '14px', margin: 0 }}>{title}</p>
          <p style={{ color: '#e8edf5', fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>{value}</p>
        </div>
        <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)' }}>
          <span style={{ fontSize: '24px' }}>{icon}</span>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
