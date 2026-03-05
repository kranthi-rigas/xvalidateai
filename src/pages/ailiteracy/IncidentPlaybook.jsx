import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import COLORS from "@/styles/colors";
import playbookContent from "./data/incidentPlaybook.md?raw";

export default function IncidentPlaybook() {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const prevent = (e) => e.preventDefault();

    el.addEventListener("copy", prevent);
    el.addEventListener("cut", prevent);
    el.addEventListener("contextmenu", prevent);

    return () => {
      el.removeEventListener("copy", prevent);
      el.removeEventListener("cut", prevent);
      el.removeEventListener("contextmenu", prevent);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        border: `1px solid ${COLORS.borderLight}`,
        borderRadius: 12,
        padding: "28px 32px",
        background: COLORS.bgPrimary,
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
        lineHeight: 1.7,
        color: COLORS.textSecondary,
      }}
    >
      <div className="ai-playbook-markdown">
        <ReactMarkdown>{playbookContent}</ReactMarkdown>
      </div>

      <style>{`
        .ai-playbook-markdown h1 {
          font-size: 24px;
          font-weight: 700;
          color: ${COLORS.textPrimary};
          margin-bottom: 16px;
          border-bottom: 2px solid ${COLORS.borderLight};
          padding-bottom: 10px;
        }
        .ai-playbook-markdown h2 {
          font-size: 19px;
          font-weight: 700;
          color: ${COLORS.primary};
          margin-top: 28px;
          margin-bottom: 12px;
        }
        .ai-playbook-markdown h3 {
          font-size: 16px;
          font-weight: 600;
          color: ${COLORS.textPrimary};
          margin-top: 18px;
          margin-bottom: 8px;
        }
        .ai-playbook-markdown p {
          margin-bottom: 12px;
        }
        .ai-playbook-markdown ul,
        .ai-playbook-markdown ol {
          padding-left: 24px;
          margin-bottom: 12px;
        }
        .ai-playbook-markdown li {
          margin-bottom: 6px;
        }
        .ai-playbook-markdown table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
          font-size: 14px;
        }
        .ai-playbook-markdown th,
        .ai-playbook-markdown td {
          border: 1px solid ${COLORS.borderLight};
          padding: 10px 14px;
          text-align: left;
        }
        .ai-playbook-markdown th {
          background: ${COLORS.primaryLighter};
          font-weight: 600;
          color: ${COLORS.textPrimary};
        }
        .ai-playbook-markdown hr {
          border: none;
          border-top: 1px solid ${COLORS.borderLight};
          margin: 24px 0;
        }
        .ai-playbook-markdown blockquote {
          border-left: 4px solid ${COLORS.primary};
          padding: 12px 16px;
          margin: 16px 0;
          background: ${COLORS.bgTertiary};
          border-radius: 0 8px 8px 0;
          color: ${COLORS.textSecondary};
        }
        .ai-playbook-markdown strong {
          color: ${COLORS.textPrimary};
        }
      `}</style>
    </div>
  );
}
