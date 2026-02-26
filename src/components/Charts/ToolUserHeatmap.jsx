import React, { useEffect, useRef, useMemo } from "react";
import * as echarts from "echarts";

const ToolUserHeatmap = ({ apiData }) => {
  const chartRef = useRef(null);

  const normalizeUsers = (text) => {
    if (!text || text === "Not Specified") return ["Not Specified"];

    const lower = text.toLowerCase();
    const categories = [];

    if (lower.includes("teacher") || lower.includes("educator"))
      categories.push("Teachers");
    if (lower.includes("student")) categories.push("K-12 Students");
    if (lower.includes("parent")) categories.push("Parents");
    if (
      lower.includes("general public") ||
      lower.includes("business") ||
      lower.includes("advertiser")
    )
      categories.push("General Public");
    if (
      lower.includes("enterprise") ||
      lower.includes("organization") ||
      lower.includes("government")
    )
      categories.push("Enterprise");
    if (lower.includes("developer")) categories.push("Developers");
    if (lower.includes("researcher")) categories.push("Researchers");

    if (categories.length === 0) categories.push("Other");

    return categories;
  };

  const { tools, userCategories, toolUserMap } = useMemo(() => {
    if (!apiData?.tool_kpis?.length)
      return { tools: [], userCategories: [], toolUserMap: {} };

    const tools = apiData.tool_kpis.map((t) => t.tool_name);

    const allCategoriesSet = new Set();
    const toolUserMap = {};

    apiData.tool_kpis.forEach((tool) => {
      const categories = normalizeUsers(tool.intended_users);
      toolUserMap[tool.tool_name] = categories;
      categories.forEach((cat) => allCategoriesSet.add(cat));
    });

    return {
      tools,
      userCategories: Array.from(allCategoriesSet),
      toolUserMap,
    };
  }, [apiData]);

  useEffect(() => {
    if (!tools.length) return;

    let chart = echarts.getInstanceByDom(chartRef.current);
    if (chart) chart.dispose();
    chart = echarts.init(chartRef.current);

    const categoryColors = {
      "Not Specified": "#000000", // True Black
      Other: "#111827", // Near Black
      Parents: "#1f2937", // Dark Gray
      "General Public": "#1e3a8a", // Dark Navy
      Developers: "#1e40af", // Indigo
      Researchers: "#1d4ed8", // Strong Blue
      Teachers: "#2563eb", // Bright Blue
      Enterprise: "#3b82f6", // Light Blue
      "K-12 Students": "#facc15", // Strong Yellow (Top Highlight)
    };
    const data = [];

    tools.forEach((tool, yIndex) => {
      userCategories.forEach((category, xIndex) => {
        if (toolUserMap[tool]?.includes(category)) {
          data.push({
            value: [xIndex, yIndex, 1],
            itemStyle: {
              color: categoryColors[category] || "#93c5fd",
              borderRadius: 8,
              borderColor: "#ffffff",
              borderWidth: 2,
            },
          });
        }
      });
    });

    const option = {
      tooltip: {
        backgroundColor: "#111827",
        borderColor: "transparent",
        textStyle: { color: "#fff" },
        formatter: (params) => {
          const tool = tools[params.value[1]];
          const category = userCategories[params.value[0]];
          return `<strong>${tool}</strong><br/>${category}`;
        },
      },

      grid: {
        top: 20,
        bottom: 40,
        left: 120,
        right: 20,
      },

      xAxis: {
        type: "category",
        data: userCategories,
        axisLabel: {
          rotate: 30,
          color: "#6b7280", // softer gray
          fontSize: 12,
          fontWeight: 400,
        },
        axisLine: {
          lineStyle: { color: "#e5e7eb" },
        },
        splitArea: { show: true },
        axisTick: { show: false },
      },

      yAxis: {
        type: "category",
        data: tools,
        splitArea: { show: true },
        axisLabel: {
          color: "#6b7280", // softer gray
          fontSize: 12,
          fontWeight: 400,
        },
        axisLine: {
          lineStyle: { color: "#e5e7eb" },
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
          emphasis: {
            itemStyle: {
              shadowBlur: 12,
              shadowColor: "rgba(0,0,0,0.12)",
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

  return (
    <div className="w-full h-full">
      <div ref={chartRef} className="w-full h-full" />
    </div>
  );
};

export default ToolUserHeatmap;
