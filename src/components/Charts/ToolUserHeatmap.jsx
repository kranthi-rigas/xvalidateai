import React, { useEffect, useRef, useMemo } from "react";
import * as echarts from "echarts";

const ToolUserHeatmap = ({ apiData }) => {
  const chartRef = useRef(null);

  const normalizeUsers = (text) => {
    if (!text || text === "Not Specified") return ["Not Specified"];

    const lower = text.toLowerCase();
    const categories = [];

    // Teachers / Educators
    if (
      lower.includes("teacher") ||
      lower.includes("educator") ||
      lower.includes("k-12 teacher")
    ) {
      categories.push("Teachers");
    }

    // Students
    if (
      lower.includes("student") ||
      lower.includes("students") ||
      lower.includes("learner")
    ) {
      categories.push("K-12 Students");
    }

    // Parents
    if (lower.includes("parent") || lower.includes("guardian")) {
      categories.push("Parents");
    }

    // General Public
    if (
      lower.includes("general public") ||
      lower.includes("public") ||
      lower.includes("everyone") ||
      lower.includes("consumer")
    ) {
      categories.push("General Public");
    }

    // Enterprise / Enterprises
    if (
      lower.includes("enterprise") ||
      lower.includes("enterprises") ||
      lower.includes("organization") ||
      lower.includes("company") ||
      lower.includes("business")
    ) {
      categories.push("Enterprise");
    }

    // Developers
    if (
      lower.includes("developer") ||
      lower.includes("developers") ||
      lower.includes("programmer") ||
      lower.includes("engineer")
    ) {
      categories.push("Developers");
    }

    // Researchers
    if (
      lower.includes("researcher") ||
      lower.includes("researchers") ||
      lower.includes("scientist")
    ) {
      categories.push("Researchers");
    }

    if (categories.length === 0) categories.push("Other");

    return [...new Set(categories)];
  };

  const { tools, userCategories, toolUserMap } = useMemo(() => {
    if (!apiData?.tool_kpis?.length)
      return { tools: [], userCategories: [], toolUserMap: {} };

    const tools = apiData.tool_kpis.map((t) => t.tool_name);

    const categorySet = new Set();
    const toolUserMap = {};

    apiData.tool_kpis.forEach((tool) => {
      const categories = normalizeUsers(tool.intended_users);

      toolUserMap[tool.tool_name] = categories;

      categories.forEach((c) => categorySet.add(c));
    });

    // keep clean logical order but only show used categories
    const categoryOrder = [
      "Teachers",
      "K-12 Students",
      "Parents",
      "General Public",
      "Enterprise",
      "Developers",
      "Researchers",
      "Other",
      "Not Specified",
    ];

    const userCategories = categoryOrder.filter((c) => categorySet.has(c));

    return {
      tools,
      userCategories,
      toolUserMap,
    };
  }, [apiData]);
  useEffect(() => {
    if (!tools.length) return;

    let chart = echarts.getInstanceByDom(chartRef.current);
    if (chart) chart.dispose();

    chart = echarts.init(chartRef.current);

    const categoryColors = {
      "Not Specified": "#000000",
      Other: "#111827",
      Parents: "#1f2937",
      "General Public": "#6d28d9",
      Developers: "#0f766e",
      Researchers: "#0ea5e9",
      Teachers: "#1d4ed8",
      Enterprise: "#374151",
      "K-12 Students": "#facc15",
    };

    const data = [];

    tools.forEach((tool, yIndex) => {
      userCategories.forEach((category, xIndex) => {
        if (toolUserMap[tool]?.includes(category)) {
          data.push({
            value: [xIndex, yIndex, 1],
            itemStyle: {
              color: categoryColors[category] || "#93c5fd",
            },
          });
        }
      });
    });

    const option = {
      tooltip: {
        backgroundColor: "#111827",
        textStyle: { color: "#fff" },
        formatter: (params) => {
          const tool = tools[params.value[1]];
          const category = userCategories[params.value[0]];
          return `<strong>${tool}</strong><br/>${category}`;
        },
      },

      grid: {
        top: 20,
        bottom: 70,
        left: 120,
        right: 30,
      },

      xAxis: {
        type: "category",
        data: userCategories,

        axisLabel: {
          rotate: 30,
          color: "#6b7280",
          fontSize: 12,
        },

        axisLine: {
          lineStyle: { color: "#e5e7eb" },
        },

        splitArea: {
          show: true,
          areaStyle: {
            color: ["#f8fafc", "#f1f5f9"],
          },
        },

        axisTick: { show: false },
      },

      yAxis: {
        type: "category",
        data: tools,

        axisLabel: {
          color: "#6b7280",
          fontSize: 12,
        },

        axisLine: {
          lineStyle: { color: "#e5e7eb" },
        },

        splitArea: {
          show: true,
          areaStyle: {
            color: ["#f8fafc", "#f1f5f9"],
          },
        },

        axisTick: { show: false },
      },

      visualMap: {
        min: 0,
        max: 1,
        show: false,
      },

      series: [
        {
          type: "heatmap",
          data,

          cellSize: [38, 32], // ⭐ controls square box size

          itemStyle: {
            borderRadius: 10,
            borderColor: "#ffffff",
            borderWidth: 4,
          },

          emphasis: {
            itemStyle: {
              shadowBlur: 12,
              shadowColor: "rgba(0,0,0,0.15)",
            },
          },
        },
      ],
    };

    chart.setOption(option);

    const resize = () => chart.resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chart.dispose();
    };
  }, [tools, userCategories, toolUserMap]);

  const chartHeight = Math.min(420, Math.max(220, tools.length * 40));
  return (
    <div className="w-full">
      <div ref={chartRef} style={{ height: chartHeight }} className="w-full" />
    </div>
  );
};

export default ToolUserHeatmap;
