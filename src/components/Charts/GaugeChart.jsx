import Chart from "react-apexcharts";

/**
 * Reusable Gauge Chart Component
 *
 * @param {number} value - Current value
 * @param {number} min - Minimum value (default 0)
 * @param {number} max - Maximum value (default 100)
 * @param {string} label - Label shown below gauge
 * @param {string} color - Gauge color
 * @param {number} size - Chart height/width
 * @param {function} formatter - Custom value formatter
 */
export default function GaugeChart({
  value = 0,
  min = 0,
  max = 100,
  label,
  color = "#2563eb",
  size = 160,
  formatter = (val) => `${Math.round(val)}%`,
  onClick,
}) {
  // Normalize value to percentage for ApexCharts
  const normalizedValue = max > min ? ((value - min) / (max - min)) * 100 : 0;

  const options = {
    chart: {
      type: "radialBar",
      sparkline: { enabled: true },
    },
    colors: [color],
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 270,
        hollow: {
          size: "60%",
        },
        track: {
          background: "#e5e7eb",
        },
        dataLabels: {
          name: { show: false },
          value: {
            fontSize: "20px",
            fontWeight: 600,
            formatter: () => formatter(value),
          },
        },
      },
    },
    stroke: {
      lineCap: "round",
    },
  };

  return (
    <div
      className="gauge-card"
      style={{ cursor: onClick ? "pointer" : "default" }}
      onClick={onClick}
    >
      <Chart
        options={options}
        series={[Math.min(Math.max(normalizedValue, 0), 100)]}
        type="radialBar"
        height={size}
      />

      {label && <div className="gauge-label">{label}</div>}
    </div>
  );
}
