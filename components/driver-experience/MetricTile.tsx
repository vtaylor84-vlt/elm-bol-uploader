import React from 'react';

interface MetricTileProps {
  label: string;
  value: string;
  hint?: string;
}

const MetricTile: React.FC<MetricTileProps> = ({ label, value, hint }) => (
  <div className="mc-metric-tile">
    <p className="mc-metric-label">{label}</p>
    <p className="mc-metric-value">{value}</p>
    {hint ? <p className="mc-metric-hint">{hint}</p> : null}
  </div>
);

export default MetricTile;
