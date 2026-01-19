import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchAllExams } from "../../apiIntegration/mockTests";
import { FiChevronDown, FiChevronUp, FiPlay } from "react-icons/fi";
import PageLoader from "../common/PageLoader";
import usePageLoader from "@/data/usePageLoader";

/* ============================================================
   TILE COMPONENT
============================================================ */
function ExamTile({
  examName,
  testCount,
  isActive,
  onHover,
  onLeave,
  onToggle,
}) {
  const getExamIcon = () => {
    if (examName.toLowerCase().includes("ts eapcet")) {
      return "/assets/img/mocktests/ts-eapcet.png";
    }
    if (examName.toLowerCase().includes("jee")) {
      return "/assets/img/mocktests/jee.png";
    }
    if (examName.toLowerCase().includes("neet")) {
      return "/assets/img/mocktests/neet.png";
    }
    return "/assets/img/mocktests/jee.png";
  };

  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onToggle}
      style={{
        border: "1.5px solid",
        borderColor: isActive ? "#6366F1" : "#E2E8F0",
        borderRadius: 18,
        padding: "clamp(14px, 3vw, 22px) clamp(16px, 4vw, 26px)",
        background: "white",
        cursor: "pointer",
        transition: "0.25s",
        boxShadow: isActive
          ? "0 8px 28px rgba(99,102,241,0.18)"
          : "0 3px 10px rgba(0,0,0,0.06)",
        transform: isActive ? "translateY(-4px)" : "none",
      }}
    >
      {/* ICON + TITLE */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "clamp(10px, 2vw, 16px)",
        }}
      >
        <div
          style={{
            width: "clamp(44px, 8vw, 56px)",
            height: "clamp(44px, 8vw, 56px)",
            minWidth: 44,
            minHeight: 44,
            borderRadius: "50%",
            background: "#EEF2FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <img
            src={getExamIcon()}
            alt="icon"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "clamp(16px, 3vw, 20px)",
              fontWeight: 700,
              color: "#0F172A",
              wordBreak: "break-word",
            }}
          >
            {examName}
          </div>
          <div style={{ fontSize: "clamp(12px, 2vw, 14px)", color: "#64748B" }}>
            {testCount} mock tests available
          </div>
        </div>
      </div>

      {/* CHEVRON */}
      <div style={{ textAlign: "right", marginTop: 10 }}>
        {isActive ? (
          <FiChevronUp
            size={window.innerWidth < 768 ? 18 : 22}
            color="#475569"
          />
        ) : (
          <FiChevronDown
            size={window.innerWidth < 768 ? 18 : 22}
            color="#475569"
          />
        )}
      </div>
    </div>
  );
}

/* ============================================================
   HOVER MENU
============================================================ */
function HoverMenu({ years, navigate, onEnter, onLeave }) {
  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        position: "absolute",
        top: "105%",
        left: 0,
        width: "100%",
        background: "white",
        borderRadius: 18,
        border: "1px solid #E2E8F0",
        padding: "clamp(14px, 3vw, 22px)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.12)",
        zIndex: 50,
        animation: "fadeSlide 0.2s ease-out",
        maxHeight: "70vh",
        overflowY: "auto",
      }}
    >
      <style>
        {`
          @keyframes fadeSlide {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>

      {Object.entries(years).map(([year, tests]) => (
        <div
          key={year}
          style={{
            background: "#F8FAFC",
            borderRadius: 14,
            padding: "clamp(12px, 2.5vw, 16px) clamp(14px, 3vw, 20px)",
            marginBottom: 18,
            border: "1px solid #E2E8F0",
          }}
        >
          {/* YEAR TITLE */}
          <div
            style={{
              fontWeight: 700,
              fontSize: "clamp(14px, 2.5vw, 16px)",
              marginBottom: 12,
            }}
          >
            {year}
          </div>

          {/* TEST LIST */}
          {tests.map((test, i) => (
            <div
              key={test.exam_id}
              style={{
                padding: "12px 0",
                borderBottom:
                  i === tests.length - 1 ? "none" : "1px solid #E5E7EB",
                display: "flex",
                flexDirection: window.innerWidth < 480 ? "column" : "row",
                justifyContent: "space-between",
                alignItems: window.innerWidth < 480 ? "flex-start" : "center",
                gap: window.innerWidth < 480 ? 8 : 0,
              }}
            >
              <span
                style={{
                  fontSize: "clamp(12px, 2vw, 14px)",
                  color: "#334155",
                  flex: 1,
                  wordBreak: "break-word",
                }}
              >
                {test.title}
              </span>

              <button
                onClick={() =>
                  navigate(
                    `/dashboard/quiz?exam_id=${test.exam_id}&autostart=true`
                  )
                }
                style={{
                  background: "#6366F1",
                  padding: "clamp(5px, 1vw, 6px) clamp(12px, 2.5vw, 16px)",
                  borderRadius: 999,
                  color: "white",
                  fontSize: "clamp(11px, 2vw, 13px)",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  border: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  alignSelf: window.innerWidth < 480 ? "flex-start" : "auto",
                }}
              >
                <FiPlay size={window.innerWidth < 768 ? 12 : 14} /> Start
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   MAIN PAGE
============================================================ */
export default function MockTestPage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState(null);
  const [hoverExam, setHoverExam] = useState(null);
  const hoverTimeout = useRef(null);
  const pageLoading = usePageLoader([exams]);

  const didFetch = useRef(false);

  useEffect(() => {
    if (didFetch.current) return; // Prevent second call
    didFetch.current = true;

    async function loadData() {
      const data = await fetchAllExams();
      const grouped = {};

      (data.exams || []).forEach((e) => {
        if (!grouped[e.exam]) grouped[e.exam] = [];
        grouped[e.exam].push(e);
      });

      const final = {};
      Object.entries(grouped).forEach(([exam, list]) => {
        const yearGroup = {};
        list.forEach((e) => {
          if (!yearGroup[e.year]) yearGroup[e.year] = [];
          yearGroup[e.year].push(e);
        });
        final[exam] = yearGroup;
      });

      setExams(final);
    }

    loadData();
  }, []);

  // Toggle function for click/touch
  const handleToggle = (examName) => {
    clearTimeout(hoverTimeout.current);
    setHoverExam(hoverExam === examName ? null : examName);
  };

  if (pageLoading) {
    return <PageLoader loading={true} />;
  }

  return (
    <div className="dashboard__content">
      <div className="dashboard-body">
        {/* GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
            gap: "clamp(16px, 3vw, 24px)",
          }}
        >
          {Object.entries(exams).map(([examName, years]) => (
            <div key={examName} style={{ position: "relative" }}>
              <ExamTile
                examName={examName}
                testCount={Object.values(years).flat().length}
                isActive={hoverExam === examName}
                onHover={() => {
                  clearTimeout(hoverTimeout.current);
                  setHoverExam(examName);
                }}
                onLeave={() => {
                  hoverTimeout.current = setTimeout(
                    () => setHoverExam(null),
                    200
                  );
                }}
                onToggle={() => handleToggle(examName)}
              />

              {hoverExam === examName && (
                <HoverMenu
                  years={years}
                  navigate={navigate}
                  onEnter={() => clearTimeout(hoverTimeout.current)}
                  onLeave={() =>
                    (hoverTimeout.current = setTimeout(
                      () => setHoverExam(null),
                      200
                    ))
                  }
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
