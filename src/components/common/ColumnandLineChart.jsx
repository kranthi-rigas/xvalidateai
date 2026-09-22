import Chart from "react-apexcharts";
import React, { useRef, useState, useEffect } from "react";

// Tool names run long ("Perplexity (Education/Campus)"), and at full length the
// axis labels collided — ApexCharts then silently dropped the ones that
// overlapped, so several tools sat above a blank slot. Shorten them for the
// axis and keep the full name in the tooltip.
const MAX_LABEL_CHARS = 16;

const truncateLabel = (name) => {
  const text = String(name ?? "").trim();
  if (text.length <= MAX_LABEL_CHARS) return text;
  return `${text.slice(0, MAX_LABEL_CHARS - 1).trimEnd()}…`;
};

const SVG_NS = "http://www.w3.org/2000/svg";

// ApexCharts draws axis labels as bare <text> nodes, so a shortened name has
// nothing to hover. Hang a native SVG <title> off each one carrying the full
// name — it survives re-renders because we run this again on every update.
const attachFullNameTitles = (chartCtx, tools) => {
  const root = chartCtx?.el || chartCtx?.w?.globals?.dom?.baseEl;
  if (!root) return;

  root
    .querySelectorAll(".apexcharts-xaxis-texts-g text")
    .forEach((node, index) => {
      const fullName = tools[index]?.tool_name;
      if (!fullName) return;

      let title = node.querySelector("title");
      if (!title) {
        title = document.createElementNS(SVG_NS, "title");
        node.appendChild(title);
      }
      title.textContent = fullName;
      node.style.cursor = "help";
    });
};

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
      events: {
        mounted: (chartCtx) => attachFullNameTitles(chartCtx, tools),
        updated: (chartCtx) => attachFullNameTitles(chartCtx, tools),
      },
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
      tickPlacement: "on",
      labels: {
        // Angled once the axis is busy, and never hidden: every tool must carry
        // its own name, even if it has to be shortened.
        rotate: -40,
        rotateAlways: toolCount > 4,
        hideOverlappingLabels: false,
        trim: false,
        maxHeight: 140,
        formatter: (value) => truncateLabel(value),
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
      // The axis label may be shortened; the tooltip always names the tool in
      // full.
      x: {
        formatter: (value, opts) =>
          tools[opts?.dataPointIndex]?.tool_name ?? value,
      },
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

        {/* AGRI Legend with tooltip */}
        <div className="relative group cursor-help">
          <LegendDot color="#111827" label="AGRI Score" line />

          <span
            className="absolute left-1/2 -translate-x-1/2 top-full mt-2
                     hidden group-hover:block
                     bg-black text-white text-xs
                     px-2 py-1 rounded whitespace-nowrap z-50"
          >
            AI Governance Readiness Index Score
            <span
              className="absolute -top-1 left-1/2 -translate-x-1/2
                       border-4 border-transparent border-b-black"
            ></span>
          </span>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          style={{ overflowX: toolCount > 8 ? "auto" : "hidden" }}
          className="pb-2"
        >
          <div style={{ minWidth: toolCount > 8 ? toolCount * 120 : "100%" }}>
            <Chart
              options={{
                ...options,
                legend: { show: false },
                title: { text: undefined },
              }}
              series={series}
              type="line"
              height={480}
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
