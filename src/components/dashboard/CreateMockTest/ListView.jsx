import React, { useState, useEffect, useRef } from "react";
import ActionsMenu from "../../common/ActionsMenu";
import ListTable from "../../common/ListTable";
import RefreshButton from "../../common/RefreshButton";
import AwsButton from "../../common/AwsButton";
import TablePreferencesModal from "../../common/TablePreferencesModal";
import AwsSettingsIconButton from "../../common/AwsSettingsIconButton";

export default function MockTestListView({
  allExams = [],
  fetchAllExams,
  setShowCreateForm,
  setStep,
  setQuizTitle,
  setDescription,
  setExamType,
  setDuration,
  setQuestionCount,
  setExamDate,
  setCreatedExamId,
  setQuestions,
  setErrors,
  setSubmitted,
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [tableLoading, setTableLoading] = useState(false);

  const [columnWidths, setColumnWidths] = useState({
    checkbox: 60,
    title: 240,
    exam: 160,
    total_questions: 140,
    duration: 130,
    year: 120,
  });

  const resizingCol = useRef(null);
  // Preferences modal
  const [showPreferences, setShowPreferences] = useState(false);

  /* ---------- Search ---------- */
  const filtered = allExams.filter((x) =>
    (x.title || "").toLowerCase().includes(search.toLowerCase()),
  );

  /* ---------- Sorting ---------- */
  const requestSort = (key) => {
    let dir = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") dir = "desc";
    setSortConfig({ key, direction: dir });
  };

  const sorted = [...filtered]
    .map((x) => ({
      ...x,
      __isSelected: selected.includes(x.exam_id),
    }))
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const x = (a[sortConfig.key] || "").toString();
      const y = (b[sortConfig.key] || "").toString();
      return sortConfig.direction === "asc"
        ? x.localeCompare(y)
        : y.localeCompare(x);
    });

  /* ---------- Selection ---------- */
  const toggleSelect = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const toggleSelectAll = (checked) =>
    setSelected(checked ? sorted.map((x) => x.exam_id) : []);

  const createMockTest = () => {
    setStep(1);
    setQuizTitle("");
    setDescription("");
    setExamType("");
    setDuration("");
    setQuestionCount("");
    setExamDate(null);
    setCreatedExamId(null);
    setQuestions([]);

    setSubmitted(false);
    setErrors({});
    setShowCreateForm(true);
  };

  const startResize = (key, e) => {
    resizingCol.current = {
      key,
      startX: e.clientX,
      startWidth: columnWidths[key],
    };
  };

  const handleResize = (e) => {
    if (!resizingCol.current) return;
    const { key, startX, startWidth } = resizingCol.current;

    const newWidth = Math.max(80, startWidth + (e.clientX - startX));

    setColumnWidths((prev) => ({ ...prev, [key]: newWidth }));
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleResize);
    window.addEventListener("mouseup", () => (resizingCol.current = null));

    return () => {
      window.removeEventListener("mousemove", handleResize);
    };
  }, []);

  /* ---------- Columns ---------- */
  const columns = [
    {
      key: "checkbox",
      label: "",
      width: 60,
      resizable: false,
      sortable: false,

      // ⭐ Correct logic for select-all behavior
      allSelected: sorted.length > 0 && selected.length === sorted.length,

      // ⭐ Correct toggle binding
      onToggleAll: (checked) =>
        setSelected(checked ? sorted.map((x) => x.exam_id) : []),
    },

    { key: "title", label: "Mock Test Name", sortable: true, resizable: true },
    { key: "exam", label: "Exam", sortable: true, resizable: true },
    {
      key: "total_questions",
      label: "Questions",
      sortable: true,
      resizable: true,
    },
    { key: "duration", label: "Duration", sortable: true, resizable: true },
    { key: "year", label: "Year", sortable: true, resizable: true },
  ];

  /* ---------- Cell renderer ---------- */
  // Measure text width exactly like the browser does
  const measureTextWidth = (text, font = "14px Amazon Ember") => {
    const canvas =
      measureTextWidth.canvas ||
      (measureTextWidth.canvas = document.createElement("canvas"));
    const ctx = canvas.getContext("2d");
    ctx.font = font;
    return ctx.measureText(text).width;
  };

  // Should show tooltip only if truncated in actual pixels
  const shouldShowTooltip = (value, key) => {
    if (!value) return false;

    const colWidth = columnWidths[key] ?? 120; // Default width
    const max = colWidth - 24; // padding + ellipsis space
    const textWidth = measureTextWidth(value);

    return textWidth > max;
  };

  const renderCell = (row, key) => {
    if (key === "checkbox")
      return (
        <input
          type="checkbox"
          checked={selected.includes(row.exam_id)}
          onChange={() => toggleSelect(row.exam_id)}
        />
      );

    /* ------------------- TITLE ------------------- */
    if (key === "title") {
      const text = row.title || "";
      const colWidth = columnWidths.title ?? 200;
      const showTip = shouldShowTooltip(text, "title");

      return (
        <span
          style={{
            display: "inline-block",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: colWidth - 20,
            cursor: showTip ? "pointer" : "default",
          }}
          title={showTip ? text : ""}
        >
          {text}
        </span>
      );
    }

    /* ------------------- EXAM ------------------- */
    if (key === "exam") {
      const text = row.exam || "";
      const colWidth = columnWidths.exam ?? 150; // ⭐ Correct key here
      const showTip = shouldShowTooltip(text, "exam");

      return (
        <span
          style={{
            display: "inline-block",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: colWidth - 20,
            cursor: showTip ? "pointer" : "default",
          }}
          title={showTip ? text : ""}
        >
          {text}
        </span>
      );
    }

    /* ------------------- OTHER COLUMNS ------------------- */
    if (key === "total_questions")
      return (
        <span style={{ cursor: "default" }}>{row.total_questions || 0}</span>
      );

    if (key === "duration")
      return (
        <span style={{ cursor: "default" }}>{`${row.duration} mins`}</span>
      );

    if (key === "year")
      return <span style={{ cursor: "default" }}>{row.year || "-"}</span>;

    return row[key] ?? "";
  };
  // Table preferences
  const [pageSize, setPageSize] = useState(25);
  const [wrapLines, setWrapLines] = useState(false);
  const [stripedRows, setStripedRows] = useState(false);

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState(
    columns.map((c) => c.key),
  );
  const toggleColumn = (key) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };
  const visibleCols = columns.filter((c) => visibleColumns.includes(c.key));

  return (
    <div>
      {/* TOP BAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          gap: 12,
        }}
      >
        <div style={{ flex: 1, maxWidth: 420 }}>
          <input
            type="text"
            placeholder="Find mock test by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 16px",
              borderRadius: 999,
              border: "1px solid #D1D5DB",
              background: "#F9FAFB",
              fontSize: 14,
              height: 40,
              fontFamily: "Amazon Ember, sans-serif",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Refresh Button */}
          <RefreshButton
            onRefresh={fetchAllExams}
            setTableLoading={setTableLoading}
          />
          <ActionsMenu
            selected={selected}
            onEdit={(id) => {
              const exam = allExams.find((x) => x.exam_id === id);
              if (!exam) return;

              // Prefill form with exam data
              setStep(1);
              setQuizTitle(exam.title);
              setDescription(exam.description || "");
              setExamType(exam.exam || "");
              setDuration(exam.duration || 0);
              setQuestionCount(exam.total_questions || "");
              setExamDate(exam.exam_date || null);
              setCreatedExamId(exam.exam_id);
              setQuestions(exam.questions || []);

              // Open editor
              setShowCreateForm(true);
            }}
            onDelete={() => {
              console.log("delete clicked");
            }}
          />

          <AwsButton label="+ Create Mock Test" onClick={createMockTest} />
          <AwsSettingsIconButton
            onClick={() => setShowPreferences(true)}
            title="Preferences"
          />
        </div>
      </div>
      {/* ---------- Table ---------- */}
      <div style={{ position: "relative" }}>
        <ListTable
          wrapLines={wrapLines}
          stripedRows={stripedRows}
          columns={visibleCols}
          data={sorted.slice(0, pageSize)}
          rowKey="exam_id"
          renderCell={renderCell}
          sortConfig={sortConfig}
          onSort={requestSort}
          columnWidths={columnWidths}
          startResize={startResize}
        />
        {tableLoading && (
          <div className="table-refresh-overlay">
            <div className="table-spinner"></div>
          </div>
        )}
      </div>
      {showPreferences && (
        <TablePreferencesModal
          open={showPreferences}
          onClose={() => setShowPreferences(false)}
          pageSize={pageSize}
          setPageSize={setPageSize}
          wrapLines={wrapLines}
          setWrapLines={setWrapLines}
          stripedRows={stripedRows}
          setStripedRows={setStripedRows}
          columns={columns}
          visibleColumns={visibleColumns}
          toggleColumn={toggleColumn}
        />
      )}

      {/* ---------- Pagination (Static) ---------- */}
      <div
        style={{
          marginTop: 20,
          display: "flex",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <button style={pgBtn}>{"<"}</button>
        <span style={pageTag}>1</span>
        <button style={pgBtn}>{">"}</button>
      </div>
    </div>
  );
}

const pgBtn = {
  padding: "6px 12px",
  borderRadius: 999,
  background: "#F3F4F6",
  border: "1px solid #D1D5DB",
  cursor: "pointer",
};

const pageTag = {
  padding: "6px 12px",
  borderRadius: 999,
  background: "#EEF2FF",
};
