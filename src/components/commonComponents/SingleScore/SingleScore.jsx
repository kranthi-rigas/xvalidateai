import React from "react";
import "./SingleScore.css";

export default function SingleScore({
  title,
  value,
  icon,
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
  trendText = "",
  highlightValue = false,
}) {
  return (
    <div className="dashboard-card">
      {/* Top section */}
      <div className="card-top">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>

          <h3
            className={`text-4xl font-bold mt-1 ${
              highlightValue ? iconColor : "text-foreground"
            }`}
          >
            {value}
          </h3>
        </div>

        {icon && (
          <div className={`card-icon ${iconBg} ${iconColor}`}>
            <i className={icon}></i>
          </div>
        )}
      </div>

      {/* Bottom section */}
      <div className="text-xs text-muted-foreground">{trendText}</div>
    </div>
  );
}
