import React from "react";
import Chart from "react-apexcharts";

export default function ToolsHeatmap({ tools }) {
  const scoreTypes = [
    { key: "overall_score", label: "Overall" },
    { key: "privacy_safety_score", label: "Privacy & Safety" },
    { key: "instructional_impact_score", label: "Instructional" },
    { key: "usability_score", label: "Usability" },
    { key: "data_quality_score", label: "Data Quality" },
  ];

  const series = scoreTypes.map((type) => ({
    name: type.label,
    data: tools.map((tool) => ({
      x: tool.tool_name,
      y: Math.round(tool[type.key] || 0),
    })),
  }));

  const options = {
    chart: {
      type: "heatmap",
      toolbar: { show: false },
    },
    dataLabels: {
      enabled: true,
    },
    colors: ["#3b82f6"],
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.75,
        colorScale: {
          ranges: [
            { from: 0, to: 40, color: "#ff3838", name: "Low" },
            { from: 41, to: 70, color: "#f59e0b", name: "Medium" },
            { from: 71, to: 100, color: "#10b981", name: "High" },
          ],
        },
      },
    },
    title: {
      text: "Tool Score Heatmap",
      style: { fontSize: "16px", fontWeight: 600 },
    },
  };

  return (
    <Chart options={options} series={series} type="heatmap" height={400} />
  );
}
