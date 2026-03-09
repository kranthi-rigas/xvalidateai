import Chart from "react-apexcharts";
import React, { useRef, useState, useEffect } from "react";

export default function ToolsCombinedChart({ tools = [] }) {
  const toolCount = tools.length;

  // Adjust spacing dynamically
  const columnWidth = toolCount > 12 ? "35%" : toolCount > 8 ? "45%" : "55%";
  const scrollRef = useRef(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  useEffect(() => {
    if (!scrollRef.current) return;

    const el = scrollRef.current;

    const checkScroll = () => {
      const isScrollable = el.scrollWidth > el.clientWidth;
      const atEnd =
        Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth - 5;

      setShowScrollHint(isScrollable && !atEnd);
    };

    checkScroll();
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [tools]);

  const LegendDot = ({ color, label, line }) => (
    <div className="flex items-center gap-2">
      {line ? (
        <div
          style={{
            width: 18,
            height: 2,
            backgroundColor: color,
          }}
        />
      ) : (
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: 4,
            backgroundColor: color,
          }}
        />
      )}
      <span>{label}</span>
    </div>
  );

  const options = {
    chart: {
      type: "line",
      stacked: false,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 900,
        animateGradually: {
          enabled: true,
          delay: 120,
        },
        dynamicAnimation: {
          enabled: true,
          speed: 500,
        },
      },
    },

    colors: [
      "#2563eb", // Data Quality - Blue
      "#f59e0b", // Privacy - Amber
      "#007d79", // Instructional - Green
      "#8b5cf6", // Usability - Purple
      "#5b5b5c", // Overall - Dark line
    ],

    stroke: {
      width: [0, 0, 0, 0, 4],
      curve: "smooth",
    },

    plotOptions: {
      bar: {
        columnWidth: columnWidth,
        borderRadius: 6,
      },
    },

    dataLabels: {
      enabled: false,
    },

    markers: {
      size: 6,
      strokeWidth: 2,
      hover: {
        size: 8,
      },
    },

    xaxis: {
      categories: tools.map((t) => t.tool_name),
      labels: {
        rotate: toolCount > 8 ? -35 : 0,
        style: {
          fontSize: "12px",
          fontWeight: 500,
        },
      },
    },

    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 5,
      decimalsInFloat: 0,
      forceNiceScale: true,
      labels: {
        formatter: (value) => Math.round(value),
      },
      title: {
        text: "Score (0–100)",
        style: {
          fontWeight: 600,
        },
      },
    },

    grid: {
      borderColor: "#e5e7eb",
      strokeDashArray: 4,
    },

    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (val) => `${val.toFixed(1)} / 100`,
      },
    },

    legend: {
      position: "top",
      horizontalAlign: "center",
      fontSize: "13px",
      fontWeight: 500,
    },

    title: {
      text: "AI Tool Quality Pillars vs Overall Score",
      align: "center",
      style: {
        fontSize: "18px",
        fontWeight: 700,
      },
    },
  };

  const series = [
    {
      name: "Data & Reporting Quality",
      type: "column",
      data: tools.map((t) => t.data_quality_score || 0),
    },
    {
      name: "Governance & Compliance Review",
      type: "column",
      data: tools.map((t) => t.privacy_safety_score || 0),
    },
    {
      name: "Instructional & Learning Impact",
      type: "column",
      data: tools.map((t) => t.instructional_impact_score || 0),
    },
    {
      name: "Usability & Integration",
      type: "column",
      data: tools.map((t) => t.usability_score || 0),
    },
    {
      name: "AI Governance Readiness Index (AGRI) Score",
      type: "line",
      data: tools.map((t) => t.overall_score || 0),
    },
  ];

  return (
    <div className="w-full">
      <div className="text-center mb-3">
        <h3 className="text-lg font-bold">Governance & Risk Overview</h3>
      </div>

      <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-sm font-medium mb-4">
        <LegendDot color="#2563eb" label="Data & Reporting Quality" />
        <LegendDot color="#f59e0b" label="Governance & Compliance Review" />
        <LegendDot color="#007d79" label="Instructional & Learning Impact" />
        <LegendDot color="#8b5cf6" label="Usability & Integration" />
        <LegendDot
          color="#111827"
          label="AI Governance Readiness Index (AGRI) Score"
          line
        />
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          style={{ overflowX: toolCount > 10 ? "auto" : "hidden" }}
          className="pb-2"
        >
          <div style={{ minWidth: toolCount > 10 ? toolCount * 90 : "100%" }}>
            <Chart
              options={{
                ...options,
                legend: { show: false },
                title: { text: undefined },
              }}
              series={series}
              type="line"
              height={440}
            />
          </div>
        </div>

        {/* Scroll Hint Overlay */}
        {showScrollHint && (
          <div className="absolute top-0 right-0 h-full w-20 pointer-events-none flex items-center justify-end">
            {/* Gradient Fade */}
            <div className="absolute inset-0 bg-gradient-to-l from-white via-white/80 to-transparent" />

            <div className="relative pr-3 text-sm font-semibold text-gray-500 animate-pulse">
              Scroll →
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
