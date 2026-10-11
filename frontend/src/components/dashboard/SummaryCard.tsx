import React from 'react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon?: string;
  color?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  trend, 
  icon = '📊',
  color = '#3b82f6'
}) => {
  return (
    <div className="stats-card" style={{ borderLeft: '4px solid ' + color }}>
      <div className="stats-card-content">
        <div>
          <p className="stats-card-title">{icon} {title}</p>
          <p className="stats-card-value">{value}</p>
          {subtitle && <p style={{ color: '#8a96b8', fontSize: '12px', margin: '4px 0 0 0' }}>{subtitle}</p>}
          {trend !== undefined && (
            <p style={{ 
              color: trend > 0 ? '#22c55e' : '#ef4444', 
              fontSize: '12px',
              margin: '4px 0 0 0'
            }}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last hour
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
