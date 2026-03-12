import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import COLORS from "@/styles/colors";
import useToast from "@/hooks/useToast";

const INCIDENT_CATEGORIES = [
  {
    category: "Data Privacy Breach",
    examples: "Teacher uploads student data into an AI tool; chatbot stores it.",
    risks: "FERPA violation, loss of trust",
  },
  {
    category: "Algorithmic Bias",
    examples: "AI grading tool mis-scores ESL students.",
    risks: "Fairness & equity concerns",
  },
  {
    category: "Academic Integrity",
    examples: "Students use AI to complete assignments undisclosed.",
    risks: "Misconduct, policy breach",
  },
  {
    category: "Content Safety",
    examples: "AI generates harmful/inappropriate content.",
    risks: "Student safety risk",
  },
  {
    category: "Tool Misuse",
    examples: "Staff use AI without approval.",
    risks: "Reputational risk, compliance breach",
  },
];

const RESPONSE_STAGES = [
  {
    id: "detection",
    stage: "1. Detection & Reporting",
    what: "Incident identified or reported (by teacher, student, parent).",
  },
  {
    id: "assessment",
    stage: "2. Assessment & Classification",
    what: "Determine severity (low, moderate, critical).",
  },
  {
    id: "containment",
    stage: "3. Containment & Action",
    what: "Stop further use / data exposure.",
  },
  {
    id: "notification",
    stage: "4. Notification & Escalation",
    what: "Inform administration and relevant stakeholders.",
  },
  {
    id: "investigation",
    stage: "5. Investigation & Resolution",
    what: "Conduct review to identify root cause & fix.",
  },
  {
    id: "followup",
    stage: "6. Follow-up & Documentation",
    what: "Record incident & update policy if needed.",
  },
];

const ROLES = [
  "Head of School",
  "Principal",
  "IT Administrator",
  "Teachers",
  "Students",
  "Parents / Guardians",
  "Governance Committee",
];

const STAKEHOLDERS = [
  "Internal staff",
  "Students",
  "Parents / Guardians",
  "External partners / vendors",
  "Authorities (if required)",
];

function SectionHeading({ icon, title, subtitle, color }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: color + "22",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <i className={icon} style={{ fontSize: 15, color }} />
        </div>
        <h3 style={{ margin: 0, fontWeight: 700, fontSize: 16, color: COLORS.textPrimary }}>{title}</h3>
      </div>
      {subtitle && (
        <p style={{ margin: "4px 0 0 44px", fontSize: 13, color: COLORS.textMuted }}>{subtitle}</p>
      )}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, multiline }) {
  const shared = {
    width: "100%",
    padding: "7px 10px",
    fontSize: 13,
    border: `1px solid ${COLORS.borderLight}`,
    borderRadius: 6,
    background: COLORS.bgSecondary,
    color: COLORS.textPrimary,
    outline: "none",
    resize: multiline ? "vertical" : "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };
  if (multiline) {
    return (
      <textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={shared}
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={shared}
    />
  );
}

const thStyle = {
  padding: "10px 12px",
  fontWeight: 600,
  fontSize: 13,
  color: COLORS.textPrimary,
  textAlign: "left",
  borderBottom: `2px solid ${COLORS.borderLight}`,
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "10px 12px",
  fontSize: 13,
  color: COLORS.textSecondary,
  borderBottom: `1px solid ${COLORS.borderLight}`,
  verticalAlign: "top",
};

export default function IncidentResponseExercise({ onBack }) {
  const showToast = useToast();

  // Incident categories — let user mark relevance and add a note
  const [categoryNotes, setCategoryNotes] = useState(
    Object.fromEntries(INCIDENT_CATEGORIES.map((c) => [c.category, ""]))
  );
  const [categoryChecked, setCategoryChecked] = useState(
    Object.fromEntries(INCIDENT_CATEGORIES.map((c) => [c.category, false]))
  );

  // Response process table
  const [processRows, setProcessRows] = useState(
    Object.fromEntries(
      RESPONSE_STAGES.map((s) => [s.id, { responsible: "", timeframe: "", notes: "" }])
    )
  );

  // Roles table
  const [roleRows, setRoleRows] = useState(
    Object.fromEntries(ROLES.map((r) => [r, ""]))
  );

  // Communication plan
  const [commRows, setCommRows] = useState(
    Object.fromEntries(
      STAKEHOLDERS.map((s) => [s, { when: "", channel: "", sender: "" }])
    )
  );

  // Reflection
  const [reflection, setReflection] = useState({ likely: "", earlyWarning: "", leader: "" });

  const [submitted, setSubmitted] = useState(false);

  const updateProcess = (id, field, value) =>
    setProcessRows((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const updateComm = (stakeholder, field, value) =>
    setCommRows((prev) => ({ ...prev, [stakeholder]: { ...prev[stakeholder], [field]: value } }));

  const downloadPDF = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginX = 15;
    const HEADER_HEIGHT = 26;
    const FOOTER_HEIGHT = 16;
    const CONTENT_TOP = HEADER_HEIGHT + 6;
    const CONTENT_BOTTOM = pageHeight - FOOTER_HEIGHT - 4;

    const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
    const organizationName = userInfo?.organization?.name || "XVALIDATEAI";

    /* ---------- Watermark ---------- */
    const drawWatermark = () => {
      const watermarkText = organizationName.toUpperCase();
      pdf.saveGraphicsState();
      pdf.setGState(new pdf.GState({ opacity: 0.08 }));
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(180, 180, 180);
      const maxWidth = pageWidth * 0.65;
      let fontSize = 140;
      pdf.setFontSize(fontSize);
      while (pdf.getTextWidth(watermarkText) > maxWidth && fontSize > 20) {
        fontSize -= 2;
        pdf.setFontSize(fontSize);
      }
      pdf.text(watermarkText, pageWidth / 2, pageHeight / 2, {
        align: "center",
        baseline: "middle",
        angle: 45,
      });
      pdf.restoreGraphicsState();
    };

    /* ---------- Logo ---------- */
    const logoImg = new Image();
    logoImg.src = "/assets/img/general/app_logo.png";
    await new Promise((resolve) => {
      logoImg.onload = resolve;
      logoImg.onerror = resolve;
    });

    /* ---------- Header ---------- */
    const drawHeader = () => {
      try {
        const logoHeight = 10;
        const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
        pdf.addImage(logoImg, "PNG", marginX, (HEADER_HEIGHT - logoHeight) / 2, logoWidth, logoHeight);
      } catch (_) {}
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.setTextColor(15, 23, 42);
      pdf.text("AI Incident Response Playbook", pageWidth / 2, 16, { align: "center" });
      pdf.setDrawColor(226, 232, 240);
      pdf.line(marginX, HEADER_HEIGHT, pageWidth - marginX, HEADER_HEIGHT);
    };

    /* ---------- Footer ---------- */
    const drawFooter = (pageNum, totalPages) => {
      pdf.setDrawColor(226, 232, 240);
      pdf.line(marginX, pageHeight - FOOTER_HEIGHT, pageWidth - marginX, pageHeight - FOOTER_HEIGHT);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text(
        `XVALIDATEAI  © ${new Date().getFullYear()}  | AI Literacy & Governance Workshop – Phase 1`,
        pageWidth / 2,
        pageHeight - 8,
        { align: "center" }
      );
      if (pageNum && totalPages) {
        pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - marginX, pageHeight - 8, { align: "right" });
      }
    };

    /* ---------- Draw page decorations ---------- */
    const decoratePage = () => {
      drawWatermark();
      drawHeader();
      drawFooter();
    };

    /* ---------- Table section helper ---------- */
    const addSection = (title, head, body) => {
      const lastY = pdf.lastAutoTable ? pdf.lastAutoTable.finalY : CONTENT_TOP;
      const titleY = lastY + 10;

      // If title + at least one row (~18mm) won't fit before footer, add a new page
      if (titleY + 18 > CONTENT_BOTTOM) {
        pdf.addPage();
        decoratePage();
        pdf.lastAutoTable = { finalY: CONTENT_TOP };
      }

      const drawTitleAt = pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 10 : CONTENT_TOP;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(15, 23, 42);
      pdf.text(title, marginX, drawTitleAt);

      autoTable(pdf, {
        startY: drawTitleAt + 5,
        head: [head],
        body,
        margin: { top: CONTENT_TOP, bottom: FOOTER_HEIGHT + 6, left: marginX, right: marginX },
        headStyles: {
          fillColor: [248, 250, 252],
          textColor: [15, 23, 42],
          fontStyle: "bold",
          fontSize: 9,
          lineColor: [226, 232, 240],
          lineWidth: 0.3,
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [71, 85, 105],
          lineColor: [226, 232, 240],
          lineWidth: 0.3,
        },
        alternateRowStyles: { fillColor: [250, 252, 255] },
        columnStyles: { 0: { cellWidth: "auto" } },
        didDrawPage: () => {
          drawWatermark();
          drawHeader();
          drawFooter();
        },
      });
    };

    /* ---------- Page 1 ---------- */
    decoratePage();

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Date: ${date}`, marginX, CONTENT_TOP + 3);
    pdf.text(`Organisation: ${organizationName}`, marginX, CONTENT_TOP + 9);

    pdf.lastAutoTable = { finalY: CONTENT_TOP + 14 };

    /* Section 1 */
    addSection(
      "1. Incident Categories",
      ["Category", "Relevant?", "Notes", "Examples", "Risks"],
      INCIDENT_CATEGORIES.map((c) => [
        c.category,
        categoryChecked[c.category] ? "Yes" : "No",
        categoryNotes[c.category] || "—",
        c.examples,
        c.risks,
      ])
    );

    /* Section 2 */
    addSection(
      "2. Incident Response Process",
      ["Stage", "What Happens", "Responsible", "Timeframe", "Notes"],
      RESPONSE_STAGES.map((s) => {
        const row = processRows[s.id];
        return [s.stage, s.what, row.responsible || "—", row.timeframe || "—", row.notes || "—"];
      })
    );

    /* Section 3 */
    addSection(
      "3. Roles & Responsibilities",
      ["Role", "Responsibilities"],
      ROLES.map((r) => [r, roleRows[r] || "—"])
    );

    /* Section 4 */
    addSection(
      "4. Communication Plan",
      ["Stakeholder", "When to Notify", "Channel", "Sender"],
      STAKEHOLDERS.map((s) => {
        const row = commRows[s];
        return [s, row.when || "—", row.channel || "—", row.sender || "—"];
      })
    );

    /* Section 5 */
    addSection(
      "5. Reflection",
      ["Question", "Response"],
      [
        ["Most likely incident type at your school:", reflection.likely || "No response provided."],
        ["Early warning signs to watch for:", reflection.earlyWarning || "No response provided."],
        ["Recommended leader to own the response process:", reflection.leader || "No response provided."],
      ]
    );

    /* ---------- Update footers with correct total page count ---------- */
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      // Blank out old page-number area
      pdf.setFillColor(255, 255, 255);
      pdf.rect(pageWidth - marginX - 28, pageHeight - 12, 30, 8, "F");
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, pageHeight - 8, { align: "right" });
    }

    pdf.save(`incident-response-playbook-${Date.now()}.pdf`);
  };

  const handleSubmit = () => {
    // Basic validation — at least half the process rows need a responsible person
    const filled = Object.values(processRows).filter((r) => r.responsible.trim()).length;
    if (filled < 0) {
      showToast("Please fill in at least the responsible person for each response stage.", { type: "error" });
      return;
    }
    setSubmitted(true);
    showToast("Exercise saved successfully!", { type: "success" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    setCategoryNotes(Object.fromEntries(INCIDENT_CATEGORIES.map((c) => [c.category, ""])));
    setCategoryChecked(Object.fromEntries(INCIDENT_CATEGORIES.map((c) => [c.category, false])));
    setProcessRows(Object.fromEntries(RESPONSE_STAGES.map((s) => [s.id, { responsible: "", timeframe: "", notes: "" }])));
    setRoleRows(Object.fromEntries(ROLES.map((r) => [r, ""])));
    setCommRows(Object.fromEntries(STAKEHOLDERS.map((s) => [s, { when: "", channel: "", sender: "" }])));
    setReflection({ likely: "", earlyWarning: "", leader: "" });
    setSubmitted(false);
  };

  const card = {
    border: `1px solid ${COLORS.borderLight}`,
    borderRadius: 12,
    padding: "24px 28px",
    background: COLORS.bgPrimary,
    marginBottom: 24,
  };

  const tableWrapper = {
    overflowX: "auto",
    borderRadius: 8,
    border: `1px solid ${COLORS.borderLight}`,
  };

  const table = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", color: COLORS.primary, cursor: "pointer", fontSize: 14, fontWeight: 600, padding: 0, display: "flex", alignItems: "center", gap: 6, marginBottom: 24 }}
        >
          <i className="fa-solid fa-arrow-left" /> Back
        </button>

        <div
          style={{
            ...card,
            textAlign: "center",
            padding: "48px 32px",
            background: COLORS.primaryLighter,
            border: `1px solid ${COLORS.primary}`,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: COLORS.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <i className="fa-solid fa-check" style={{ color: "#fff", fontSize: 26 }} />
          </div>
          <h3 style={{ fontWeight: 700, fontSize: 20, color: COLORS.textPrimary, marginBottom: 8 }}>
            Exercise Completed!
          </h3>
          <p style={{ color: COLORS.textSecondary, fontSize: 15, maxWidth: 480, margin: "0 auto 28px" }}>
            Your Incident Response Playbook has been saved. Use the button below to download a PDF report of your completed exercise.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={handleReset}
              style={{ padding: "10px 28px", fontSize: 14, fontWeight: 600, color: COLORS.primary, background: "#fff", border: `1px solid ${COLORS.primary}`, borderRadius: 8, cursor: "pointer" }}
            >
              Start Over
            </button>
            <button
              onClick={downloadPDF}
              style={{ padding: "10px 28px", fontSize: 14, fontWeight: 600, color: COLORS.primary, background: "#fff", border: `1px solid ${COLORS.primary}`, borderRadius: 8, cursor: "pointer" }}
            >
              <i className="fa-solid fa-file-pdf" style={{ marginRight: 7 }} />
              Download PDF
            </button>
            <button
              onClick={onBack}
              style={{ padding: "10px 28px", fontSize: 14, fontWeight: 600, color: "#fff", background: COLORS.primary, border: "none", borderRadius: 8, cursor: "pointer" }}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{ background: "none", border: "none", color: COLORS.primary, cursor: "pointer", fontSize: 14, fontWeight: 600, padding: 0, display: "flex", alignItems: "center", gap: 6, marginBottom: 24 }}
      >
        <i className="fa-solid fa-arrow-left" /> Back
      </button>

      {/* Header */}
      <div style={{ ...card, background: COLORS.primaryLighter, border: `1px solid ${COLORS.primary}`, marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: COLORS.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <i className="fa-solid fa-pen-to-square" style={{ color: "#fff", fontSize: 20 }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.primary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
              Session 9 (Part 2) · Phase 1 Governance Workshop
            </div>
            <h2 style={{ margin: 0, fontWeight: 700, fontSize: 20, color: COLORS.textPrimary }}>
              Incident Response Playbook
            </h2>
            <p style={{ margin: "6px 0 0", fontSize: 14, color: COLORS.textSecondary, lineHeight: 1.6 }}>
              Design your school's step-by-step process for responding to AI-related incidents. Fill in each section below — your responses will form <strong>Section 7: Incident Response & Accountability</strong> of your Responsible AI Use Policy.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1 — Common AI Incidents */}
      <div style={card}>
        <SectionHeading
          icon="fa-solid fa-triangle-exclamation"
          title="Common AI Incidents in Schools"
          subtitle="Mark the categories relevant to your school and add any context notes."
          color={COLORS.warning}
        />
        <div style={tableWrapper}>
          <table style={table}>
            <thead>
              <tr style={{ background: COLORS.bgSecondary }}>
                <th style={{ ...thStyle, width: 32 }}></th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Examples</th>
                <th style={thStyle}>Potential Risks</th>
                <th style={{ ...thStyle, minWidth: 160 }}>Your Notes</th>
              </tr>
            </thead>
            <tbody>
              {INCIDENT_CATEGORIES.map((row) => (
                <tr key={row.category}>
                  <td style={tdStyle}>
                    <input
                      type="checkbox"
                      checked={categoryChecked[row.category]}
                      onChange={(e) =>
                        setCategoryChecked((prev) => ({ ...prev, [row.category]: e.target.checked }))
                      }
                      style={{ accentColor: COLORS.primary, width: 16, height: 16, cursor: "pointer" }}
                    />
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: COLORS.textPrimary, whiteSpace: "nowrap" }}>
                    {row.category}
                  </td>
                  <td style={tdStyle}>{row.examples}</td>
                  <td style={tdStyle}>{row.risks}</td>
                  <td style={tdStyle}>
                    <TextInput
                      value={categoryNotes[row.category]}
                      onChange={(v) =>
                        setCategoryNotes((prev) => ({ ...prev, [row.category]: v }))
                      }
                      placeholder="Add a note…"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2 — Incident Response Process */}
      <div style={card}>
        <SectionHeading
          icon="fa-solid fa-list-check"
          title="Incident Response Process"
          subtitle="For each stage, define who is responsible, the expected time frame, and any tools or notes."
          color={COLORS.primary}
        />
        <div style={tableWrapper}>
          <table style={table}>
            <thead>
              <tr style={{ background: COLORS.bgSecondary }}>
                <th style={thStyle}>Stage</th>
                <th style={thStyle}>What Happens</th>
                <th style={{ ...thStyle, minWidth: 160 }}>Who Is Responsible</th>
                <th style={{ ...thStyle, minWidth: 120 }}>Time Frame</th>
                <th style={{ ...thStyle, minWidth: 180 }}>Notes / Tools Used</th>
              </tr>
            </thead>
            <tbody>
              {RESPONSE_STAGES.map((row) => (
                <tr key={row.id}>
                  <td style={{ ...tdStyle, fontWeight: 600, color: COLORS.textPrimary, whiteSpace: "nowrap" }}>
                    {row.stage}
                  </td>
                  <td style={tdStyle}>{row.what}</td>
                  <td style={tdStyle}>
                    <TextInput
                      value={processRows[row.id].responsible}
                      onChange={(v) => updateProcess(row.id, "responsible", v)}
                      placeholder="e.g. IT Admin"
                    />
                  </td>
                  <td style={tdStyle}>
                    <TextInput
                      value={processRows[row.id].timeframe}
                      onChange={(v) => updateProcess(row.id, "timeframe", v)}
                      placeholder="e.g. 24 hrs"
                    />
                  </td>
                  <td style={tdStyle}>
                    <TextInput
                      value={processRows[row.id].notes}
                      onChange={(v) => updateProcess(row.id, "notes", v)}
                      placeholder="Tools, forms, etc."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3 — Roles */}
      <div style={card}>
        <SectionHeading
          icon="fa-solid fa-users"
          title="Roles in Incident Response"
          subtitle="Clarify each role's responsibility during an AI incident. Refer to your Roles & Accountability Matrix."
          color="#8b5cf6"
        />
        <div style={tableWrapper}>
          <table style={table}>
            <thead>
              <tr style={{ background: COLORS.bgSecondary }}>
                <th style={thStyle}>Role</th>
                <th style={{ ...thStyle, minWidth: 320 }}>Responsibility During Incident</th>
              </tr>
            </thead>
            <tbody>
              {ROLES.map((role) => (
                <tr key={role}>
                  <td style={{ ...tdStyle, fontWeight: 600, color: COLORS.textPrimary, whiteSpace: "nowrap" }}>
                    {role}
                  </td>
                  <td style={tdStyle}>
                    <TextInput
                      value={roleRows[role]}
                      onChange={(v) => setRoleRows((prev) => ({ ...prev, [role]: v }))}
                      placeholder="Describe their responsibility…"
                      multiline
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4 — Communication Plan */}
      <div style={card}>
        <SectionHeading
          icon="fa-solid fa-bullhorn"
          title="Communication Plan"
          subtitle="Who needs to know, and when?"
          color={COLORS.info}
        />
        <div style={tableWrapper}>
          <table style={table}>
            <thead>
              <tr style={{ background: COLORS.bgSecondary }}>
                <th style={thStyle}>Stakeholder Group</th>
                <th style={{ ...thStyle, minWidth: 140 }}>When to Notify</th>
                <th style={{ ...thStyle, minWidth: 200 }}>Communication Channel / Method</th>
                <th style={{ ...thStyle, minWidth: 140 }}>Who Sends It</th>
              </tr>
            </thead>
            <tbody>
              {STAKEHOLDERS.map((s) => (
                <tr key={s}>
                  <td style={{ ...tdStyle, fontWeight: 600, color: COLORS.textPrimary, whiteSpace: "nowrap" }}>
                    {s}
                  </td>
                  <td style={tdStyle}>
                    <TextInput
                      value={commRows[s].when}
                      onChange={(v) => updateComm(s, "when", v)}
                      placeholder="e.g. Immediately"
                    />
                  </td>
                  <td style={tdStyle}>
                    <TextInput
                      value={commRows[s].channel}
                      onChange={(v) => updateComm(s, "channel", v)}
                      placeholder="e.g. Email, Phone"
                    />
                  </td>
                  <td style={tdStyle}>
                    <TextInput
                      value={commRows[s].sender}
                      onChange={(v) => updateComm(s, "sender", v)}
                      placeholder="e.g. Principal"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 5 — Reflection */}
      <div style={card}>
        <SectionHeading
          icon="fa-solid fa-lightbulb"
          title="Reflection & Next Steps"
          subtitle="Consider your school's specific context."
          color={COLORS.warning}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {[
            {
              key: "likely",
              label: "What types of AI incidents are most likely to occur at your school?",
            },
            {
              key: "earlyWarning",
              label: "What early warning signs should staff be trained to notice?",
            },
            {
              key: "leader",
              label: "Who will lead the creation of your school's AI Incident Response Plan?",
            },
          ].map(({ key, label }) => (
            <div key={key}>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  fontSize: 14,
                  color: COLORS.textPrimary,
                  marginBottom: 8,
                }}
              >
                {label}
              </label>
              <textarea
                rows={3}
                value={reflection[key]}
                onChange={(e) => setReflection((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder="Write your response here…"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: 14,
                  border: `1px solid ${COLORS.borderLight}`,
                  borderRadius: 8,
                  background: COLORS.bgSecondary,
                  color: COLORS.textPrimary,
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "inherit",
                  lineHeight: 1.6,
                  boxSizing: "border-box",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginBottom: 32 }}>
        <button
          onClick={handleReset}
          style={{
            padding: "11px 28px",
            fontSize: 14,
            fontWeight: 600,
            color: COLORS.textMuted,
            background: COLORS.bgSecondary,
            border: `1px solid ${COLORS.borderLight}`,
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Reset
        </button>
        <button
          onClick={handleSubmit}
          style={{
            padding: "11px 32px",
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            background: COLORS.primary,
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            transition: "background 0.2s ease",
          }}
          onMouseOver={(e) => (e.target.style.background = COLORS.primaryDark)}
          onMouseOut={(e) => (e.target.style.background = COLORS.primary)}
        >
          <i className="fa-solid fa-floppy-disk" style={{ marginRight: 8 }} />
          Save Exercise
        </button>
      </div>

      {/* Footer note */}
      <div
        style={{
          textAlign: "center",
          fontSize: 12,
          color: COLORS.textMuted,
          borderTop: `1px solid ${COLORS.borderLight}`,
          paddingTop: 16,
          marginBottom: 32,
        }}
      >
      XVALIDATEAI  © {new Date().getFullYear()}  | AI Literacy & Governance Workshop – Phase 1
      </div>
    </div>
  );
}
