import React, { useMemo, useState, useRef, useEffect } from "react";

const ToolUserHeatmap = ({ apiData }) => {
  const [tooltip, setTooltip] = useState(null);
  const containerRef = useRef(null);
  const labelRefs = useRef({});
  const [truncatedTools, setTruncatedTools] = useState({});

  const normalizeUsers = (text) => {
    if (!text || text === "Not Specified") return ["Not Specified"];

    const lower = text.toLowerCase();
    const categories = [];

    if (lower.includes("teacher") || lower.includes("educator"))
      categories.push("Teachers");

    if (lower.includes("student") || lower.includes("learner"))
      categories.push("K-12 Students");

    if (lower.includes("parent")) categories.push("Parents");

    if (lower.includes("general public") || lower.includes("public"))
      categories.push("General Public");

    if (
      lower.includes("enterprise") ||
      lower.includes("organization") ||
      lower.includes("company") ||
      lower.includes("administrator") ||
      lower.includes("institution")
    )
      categories.push("Enterprise");

    if (lower.includes("developer") || lower.includes("engineer"))
      categories.push("Developers");

    if (lower.includes("researcher") || lower.includes("scientist"))
      categories.push("Researchers");

    if (categories.length === 0) categories.push("Other");

    return categories;
  };

  const { tools, categories, toolUserMap } = useMemo(() => {
    if (!apiData?.tool_kpis?.length) {
      return { tools: [], categories: [], toolUserMap: {} };
    }

    const tools = apiData.tool_kpis.map((t) => t.tool_name);

    const toolUserMap = {};
    const categorySet = new Set();

    apiData.tool_kpis.forEach((tool) => {
      const cats = normalizeUsers(tool.intended_users || "");

      const uniqueCats = [...new Set(cats)];

      toolUserMap[tool.tool_name] = uniqueCats;

      uniqueCats.forEach((c) => categorySet.add(c));
    });

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

    const categories = categoryOrder.filter((c) => categorySet.has(c));

    return { tools, categories, toolUserMap };
  }, [apiData]);

  useEffect(() => {
    const newMap = {};

    Object.keys(labelRefs.current).forEach((tool) => {
      const el = labelRefs.current[tool];
      if (el) {
        newMap[tool] = el.scrollWidth > el.clientWidth;
      }
    });

    setTruncatedTools(newMap);
  }, [tools]);
  const columnWidth = 80;

  return (
    <div style={{ width: "100%", display: "flex", position: "relative" }}>
      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: "fixed",
            top: tooltip.y + 12,
            left: tooltip.x + 12,
            background: "#111827",
            color: "#fff",
            padding: "6px 10px",
            borderRadius: 6,
            fontSize: 12,
            pointerEvents: "none",
            zIndex: 999,
          }}
        >
          <strong>{tooltip.tool}</strong>
          <br />
          {tooltip.category}
        </div>
      )}

      {/* Category Column */}
      <div
        style={{
          minWidth: 200,
          background: "#fff",
          borderRight: "1px solid #eee",
        }}
      >
        {categories.map((cat) => (
          <div
            key={cat}
            style={{
              height: 60,
              display: "flex",
              alignItems: "center",
              paddingLeft: 14,
              fontSize: 13,
              color: "#6b7280",
            }}
          >
            {cat}
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div
        ref={containerRef}
        style={{
          overflowX: "auto",
          overflowY: "hidden",
          width: "100%",
          display: "flex",
          justifyContent: "flex-start",
          paddingLeft: tools.length <= 3 ? "40px" : "0px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${tools.length}, ${columnWidth}px)`,
            gridAutoRows: "60px",
            columnGap: "10px",
          }}
        >
          {categories.map((cat) =>
            tools.map((tool) => {
              const active = toolUserMap[tool]?.includes(cat);

              return (
                <div
                  key={`${cat}-${tool}`}
                  onMouseMove={(e) => {
                    if (!active) return;
                    setTooltip({
                      x: e.clientX,
                      y: e.clientY,
                      tool,
                      category: cat,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    width: 42,
                    height: 42,
                    margin: "auto",
                    borderRadius: 10,
                    background: active ? "#16a34a" : "#ef4444",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: active ? "pointer" : "default",
                  }}
                >
                  <i
                    className={`fa-solid ${
                      active ? "fa-check" : "fa-xmark"
                    } text-white text-sm`}
                  />
                </div>
              );
            }),
          )}

          {/* Tool labels */}
          {tools.map((tool) => (
            <div
              key={tool}
              style={{
                height: 90,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
              }}
            >
              <div
                ref={(el) => (labelRefs.current[tool] = el)}
                title={truncatedTools[tool] ? tool : ""}
                style={{
                  maxWidth: 70,
                  fontSize: 12,
                  color: "#6b7280",
                  transform: "rotate(-45deg)",
                  transformOrigin: "top right",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  cursor: truncatedTools[tool] ? "pointer" : "default",
                }}
              >
                {tool}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ToolUserHeatmap;
