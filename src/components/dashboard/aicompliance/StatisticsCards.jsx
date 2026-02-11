import React from "react";

export default function StatisticsCards({
  totalScanned = 0,
  compliantTools = 0,
  approvedWithLimits = 0,
  highRiskBlocked = 0,
}) {
  const stats = [
    {
      label: "Total Tools Scanned",
      value: totalScanned,
      color: "indigo",
      bgColor: "#EEF2FF",
      textColor: "#0F3053",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
            stroke="#0F3053"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      label: "Approved Tools",
      value: compliantTools,
      color: "green",
      bgColor: "#D1FAE5",
      textColor: "#059669",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
            stroke="#059669"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      label: "Approved with Limits",
      value: approvedWithLimits,
      color: "amber",
      bgColor: "#FEF3C7",
      textColor: "#D97706",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
            stroke="#D97706"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      label: "High Risk",
      value: highRiskBlocked,
      color: "red",
      bgColor: "#FEE2E2",
      textColor: "#DC2626",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 2L22 20H2L12 2Z" fill="#DC2626" />
          <rect x="11" y="9" width="2" height="6" fill="white" rx="1" />
          <rect x="11" y="16.5" width="2" height="2" fill="white" rx="1" />
        </svg>
      ),
    },
  ];

  const styles = `
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 16px;
      padding: 16px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      cursor: default;
      position: relative;
      overflow: hidden;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }

    .stat-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
      border-color: #D1D5DB;
    }

    .stat-card:hover::before {
      opacity: 1;
    }

    .stat-card:active {
      transform: translateY(-3px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
    }

    .stat-content {
      flex: 1;
    }

    .stat-label {
      font-size: 12px;
      color: #6B7280;
      margin-bottom: 6px;
      font-weight: 500;
      letter-spacing: 0.3px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      line-height: 1;
      letter-spacing: -0.3px;
    }

    .stat-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 12px;
      flex-shrink: 0;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .stat-card:hover .stat-icon-wrapper {
      transform: scale(1.08) rotate(4deg);
    }

    /* Laptop/Desktop (1440px+) */
    @media (min-width: 1440px) {
      .stats-grid {
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 20px;
      }

      .stat-card {
        padding: 18px 20px;
      }

      .stat-value {
        font-size: 26px;
      }

      .stat-label {
        font-size: 12px;
        margin-bottom: 6px;
      }

      .stat-icon-wrapper {
        width: 50px;
        height: 50px;
        margin-left: 14px;
      }
    }

    /* Large Desktop (1280px - 1439px) */
    @media (min-width: 1280px) and (max-width: 1439px) {
      .stats-grid {
        grid-template-columns: repeat(4, 1fr);
        gap: 14px;
        margin-bottom: 18px;
      }

      .stat-card {
        padding: 16px 18px;
      }

      .stat-value {
        font-size: 24px;
      }

      .stat-icon-wrapper {
        width: 48px;
        height: 48px;
        margin-left: 12px;
      }
    }

    /* Standard Desktop (1024px - 1279px) */
    @media (min-width: 1024px) and (max-width: 1279px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-bottom: 16px;
      }

      .stat-card {
        padding: 14px 16px;
      }

      .stat-value {
        font-size: 22px;
      }

      .stat-label {
        font-size: 11px;
        margin-bottom: 5px;
      }

      .stat-icon-wrapper {
        width: 44px;
        height: 44px;
        margin-left: 10px;
      }
    }

    /* Tablet (768px - 1023px) */
    @media (max-width: 1023px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        margin-bottom: 14px;
      }

      .stat-card {
        padding: 12px 14px;
      }

      .stat-value {
        font-size: 20px;
      }

      .stat-label {
        font-size: 10px;
        margin-bottom: 4px;
      }

      .stat-icon-wrapper {
        width: 40px;
        height: 40px;
        margin-left: 8px;
      }
    }

    /* Mobile (below 768px) */
    @media (max-width: 767px) {
      .stats-grid {
        grid-template-columns: 1fr;
        gap: 8px;
        margin-bottom: 12px;
      }

      .stat-card {
        padding: 12px 14px;
      }

      .stat-value {
        font-size: 18px;
      }

      .stat-label {
        font-size: 10px;
        margin-bottom: 4px;
      }

      .stat-icon-wrapper {
        width: 40px;
        height: 40px;
        margin-left: 8px;
      }
    }

    /* Animation on mount */
    @keyframes slideUpFade {
      from {
        opacity: 0;
        transform: translateY(15px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .stat-card {
      animation: slideUpFade 0.4s ease-out forwards;
    }

    .stat-card:nth-child(1) {
      animation-delay: 0.05s;
    }

    .stat-card:nth-child(2) {
      animation-delay: 0.1s;
    }

    .stat-card:nth-child(3) {
      animation-delay: 0.15s;
    }

    .stat-card:nth-child(4) {
      animation-delay: 0.2s;
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-content">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value" style={{ color: stat.textColor }}>
                {stat.value.toLocaleString()}
              </div>
            </div>
            <div
              className="stat-icon-wrapper"
              style={{ background: stat.bgColor }}
            >
              {stat.icon}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
