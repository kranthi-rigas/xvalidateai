import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

let idCounter = 0;

export default function MermaidDiagram({ chart }) {
  const ref = useRef(null);
  const [svg, setSvg] = useState("");
  const id = useRef(`mermaid-${++idCounter}`);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: "neutral" });

    mermaid.render(id.current, chart).then(({ svg: rendered }) => {
      setSvg(rendered);
    });
  }, [chart]);

  return (
    <div
      ref={ref}
      style={{
        overflowX: "auto",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "8px 0",
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
