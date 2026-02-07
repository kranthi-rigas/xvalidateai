import React, { useState, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";
import PageLoader from "@/components/common/PageLoader";

const FAQS = [
  {
    q: "What is a Tool Assessment?",
    a: "A Tool Assessment evaluates AI tools for compliance, governance, and risk before approval for organizational usage.",
  },
  {
    q: "Who is allowed to create a Tool Assessment?",
    a: "Admins and Auditors can create assessments. Analysts have view-only access to reports and results.",
  },
  {
    q: "What happens after a tool is submitted for assessment?",
    a: "The tool enters a scanning queue. Once the scan completes, it can be approved or rejected based on compliance results.",
  },
  {
    q: "Why does a scan sometimes take longer than expected?",
    a: "Scan duration depends on tool complexity, data sources, and system load. Large tools may require extended analysis time.",
  },
  {
    q: "Can a Tool Assessment be edited or deleted?",
    a: "Admins can edit or delete assessments unless a scan is currently in progress.",
  },
  {
    q: "Which plan supports multiple organizations?",
    a: "The Enterprise plan supports managing multiple organizations and advanced governance controls.",
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setPageLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  if (pageLoading) return <PageLoader loading />;

  return (
    <div className="spicy-y">
      <div className="dashboard-body">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#111827" }}>
            Frequently Asked Questions
          </h2>
          <p
            style={{
              color: "#6B7280",
              marginTop: 8,
              fontSize: 15,
              maxWidth: 640,
              marginInline: "auto",
            }}
          >
            Find answers to common questions about AI Compliance and
            assessments.
          </p>
        </div>

        {/* FAQ Card */}
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            background: "#FFFFFF",
            borderRadius: 16,
            border: "1px solid #E5E7EB",
            boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}
        >
          {FAQS.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                style={{
                  borderBottom:
                    index !== FAQS.length - 1 ? "1px solid #E5E7EB" : "none",
                  background: isOpen ? "#F9FAFB" : "#FFFFFF",
                  transition: "background 0.2s ease",
                }}
              >
                {/* Question */}
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  style={{
                    width: "100%",
                    padding: "22px 24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    {item.q}
                  </span>

                  <FiChevronDown
                    size={20}
                    style={{
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                      color: "#6B7280",
                    }}
                  />
                </button>

                {/* Answer */}
                {/* Answer */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                    transition: "grid-template-rows 300ms ease",
                  }}
                >
                  <div
                    style={{
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "0 24px 22px",
                        fontSize: 14.5,
                        lineHeight: 1.7,
                        color: "#374151",
                        opacity: isOpen ? 1 : 0,
                        transform: isOpen
                          ? "translateY(0)"
                          : "translateY(-4px)",
                        transition: "opacity 200ms ease, transform 200ms ease",
                      }}
                    >
                      {item.a}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer CTA */}
        <div
          style={{
            marginTop: 32,
            textAlign: "center",
            fontSize: 14,
            color: "#6B7280",
          }}
        >
          <div
            style={{
              marginTop: 32,
              textAlign: "center",
              fontSize: 14,
              color: "#6B7280",
            }}
          >
            Still have questions? Reach us at{" "}
            <a
              href="mailto:support@academy51.com"
              className="text-purple-1 fw-500"
              style={{ textDecoration: "none" }}
            >
              support@academy51.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
