import React from "react";
import Chart from "react-apexcharts";

const colors = ["#6366F1", "#22C55E", "#F97316", "#EC4899", "#06B6D4"];

function RadarQualityChart({ tools = [] }) {
  if (!tools || tools.length === 0) {
    return (
      <div className="flex items-center justify-center h-[360px] text-muted-foreground">
        No data available
      </div>
    );
  }
  console.log("Rendering RadarQualityChart with tools:", tools);
  const series = tools
    .map((tool) => {
      const data = [
        Number(tool.overall_score),
        Number(tool.privacy_safety_score),
        Number(tool.instructional_impact_score),
        Number(tool.usability_score),
        Number(tool.data_quality_score),
      ];

      // filter out tools with invalid data
      if (data.some((v) => isNaN(v))) return null;

      return {
        name: tool.tool_name || "Unknown",
        data,
      };
    })
    .filter(Boolean);

  const options = {
    chart: {
      type: "radar",
      toolbar: { show: false },
    },

    colors: [
      "#4F46E5", // Indigo
      "#16A34A", // Green
      "#EA580C", // Orange
      "#DB2777", // Pink
    ],

    stroke: { width: 3 },

    fill: { opacity: 0.35 },

    markers: {
      size: 6, // must be >= 5
      strokeWidth: 2,
      strokeColor: "#fff",
      hover: {
        size: 9,
      },
    },

    tooltip: {
      enabled: true,
      intersect: true,
      shared: false,
      followCursor: true,
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        const category = w.config.xaxis.categories[dataPointIndex];

        let html = `<div style="padding:8px"><strong>${category}</strong><br/>`;

        w.config.series.forEach((s, idx) => {
          html += `${s.name}: ${series[idx][dataPointIndex]}<br/>`;
        });

        html += `</div>`;
        return html;
      },
    },

    xaxis: {
      categories: [
        "Overall Score",
        "Privacy & Safety",
        "Instructional Impact",
        "Usability",
        "Data Quality",
      ],
    },

    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 4,
    },

    legend: {
      position: "left",
    },

    plotOptions: {
      radar: {
        size: 200,
        polygons: {
          strokeColors: "#E5E7EB",
          fill: {
            colors: ["#F9FAFB", "#FFFFFF"],
          },
        },
      },
    },
  };

  return <Chart options={options} series={series} type="radar" height={450} />;
}

export default React.memo(RadarQualityChart, (prevProps, nextProps) => {
  // Custom comparison to check if tools array has changed
  if (!prevProps.tools || !nextProps.tools) {
    return prevProps.tools === nextProps.tools;
  }
  if (prevProps.tools.length !== nextProps.tools.length) {
    return false;
  }
  // Compare IDs of tools
  return prevProps.tools.every(
    (tool, idx) => tool.id === nextProps.tools[idx].id,
  );
});
