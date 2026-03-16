import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

let idCounter = 0;

export default function MermaidDiagram({ chart }) {
  // Render into this hidden container so Mermaid never appends to document.body,
  // which would cause a scrollbar flash and sidebar layout jump.
  const renderContainerRef = useRef(null);
  const [svg, setSvg] = useState("");
  const id = useRef(`mermaid-${++idCounter}`);

  useEffect(() => {
    if (!renderContainerRef.current) return;
    mermaid.initialize({ startOnLoad: false, theme: "neutral" });

    mermaid.render(id.current, chart, renderContainerRef.current).then(({ svg: rendered }) => {
      setSvg(rendered);
    });
  }, [chart]);

  return (
    <>
      {/* Off-screen container Mermaid renders into — keeps it out of document.body */}
      <div
        ref={renderContainerRef}
        style={{
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          overflow: "hidden",
        }}
      />
      <div
        style={{
          overflowX: "auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "8px 0",
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </>
  );
}
