import React from 'react';

/**
 * Modern stat card component matching the Academy 51 design system
 * @param {Object} props
 * @param {string} props.label - Card label/title
 * @param {string|number} props.value - Main value to display
 * @param {string} props.icon - Lucide icon name (e.g., "lucide:database")
 * @param {string} props.iconColor - Icon background color variant (primary, success, warning, destructive)
 * @param {string} props.trend - Trend text (e.g., "+12 this month")
 * @param {string} props.trendDirection - Trend direction (up, down, neutral)
 * @param {string} props.trendIcon - Lucide icon for trend (e.g., "lucide:trending-up")
 */
export default function StatCard({
  label,
  value,
  icon,
  iconColor = 'primary',
  trend,
  trendDirection = 'neutral',
  trendIcon
}) {
  const iconColorClasses = {
    primary: 'stat-icon-primary',
    success: 'stat-icon-success',
    warning: 'stat-icon-warning',
    destructive: 'stat-icon-destructive'
  };

  const trendColorClasses = {
    up: 'stat-trend-up',
    down: 'stat-trend-down',
    neutral: 'stat-trend-neutral'
  };

  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className="stat-card-label">{label}</div>
        <div className={`stat-card-icon ${iconColorClasses[iconColor]}`}>
          <iconify-icon icon={icon}></iconify-icon>
        </div>
      </div>
      <div className="stat-card-value">{value}</div>
      {trend && (
        <div className={`stat-card-trend ${trendColorClasses[trendDirection]}`}>
          {trendIcon && <iconify-icon icon={trendIcon} style={{ fontSize: '14px' }}></iconify-icon>}
          {trend}
        </div>
      )}
    </div>
  );
}

// Made with Bob
