import React, { useEffect, useState } from "react";

export default function PageLoader({
  loading,
  minHeight = "60vh",
  message = "Loading...",
}) {
  const [visible, setVisible] = useState(false);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    if (loading) {
      setVisible(true);
      setStartTime(Date.now());
    } else if (startTime) {
      const elapsed = Date.now() - startTime;
      const minimumDuration = 1800; // match spinner animation time

      if (elapsed < minimumDuration) {
        const remaining = minimumDuration - elapsed;
        const timer = setTimeout(() => {
          setVisible(false);
        }, remaining);

        return () => clearTimeout(timer);
      } else {
        setVisible(false);
      }
    }
  }, [loading]);

  if (!visible) return null;

  return (
    <div
      style={{
        minHeight,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div className="page-loader-card">
        <div className="page-spinner">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i}></div>
          ))}
        </div>
        <p className="page-loader-text">{message}</p>
      </div>
    </div>
  );
}
