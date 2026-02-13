import React from "react";
import Chart from "react-apexcharts";

export default function ToolsCombinedChart({ tools }) {
  const options = {
    chart: {
      type: "line",
      stacked: false,
      toolbar: { show: false },
      zoom: {
        enabled: false,
      },
    },
    stroke: {
      width: [0, 3],
    },
    xaxis: {
      categories: tools.map((t) => t.tool_name),
    },
    yaxis: [
      {
        title: {
          text: "Overall Score",
        },
        min: 0,
        max: 100,
      },
      {
        opposite: true,
        title: {
          text: "Compliance Count",
        },
      },
    ],
    title: {
      text: "Overall Score vs Compliance Count",
      style: { fontSize: "16px", fontWeight: 600 },
    },
  };

  const series = [
    {
      name: "Overall Score",
      type: "column",
      data: tools.map((t) => t.overall_score),
    },
    {
      name: "Compliance Count",
      type: "line",
      data: tools.map((t) => t.compliance_count),
    },
  ];

  return <Chart options={options} series={series} type="line" height={400} />;
}
