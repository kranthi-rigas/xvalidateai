import React, { useState, useRef, useEffect } from "react";
import ListTable from "@/components/common/ListTable";
import AwsButton from "@/components/common/AwsButton";
import PageLoader from "@/components/common/PageLoader";
import { HiPlus } from "react-icons/hi";
import { getIncidents, createIncident } from "@/apiIntegration/incidents";



// ─── Constants ────────────────────────────────────────────────────────────────
const ISSUE_TYPES = [
  { value: "credits_missing", label: "Credits Missing" },
  { value: "credits_needed", label: "Credits Needed" },
  { value: "billing_issue", label: "Billing Issue" },
  { value: "other", label: "Other" },
];

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  in_review: {
    label: "In Review",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  resolved: {
    label: "Resolved",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    dot: "bg-green-500",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium min-w-[280px] ${t.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
            }`}
        >
          <span>{t.type === "success" ? "✅" : "❌"}</span>
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Issue Request Full Page Form ─────────────────────────────────────────────
function IssueRequestForm({ onBack, onSubmit, loading }) {
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    email: "",
    issue_type: "",
    description: "",
    comments: "",
  });

  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
      setForm((prev) => ({
        ...prev,
        email: userInfo?.email || "",
      }));
    } catch { }
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required.";
    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Enter a valid email address.";
    if (!form.issue_type) errs.issue_type = "Please select an issue type.";
    if (!form.description.trim())
      errs.description = "Please describe the issue.";
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter(
      (f) => f.size <= 10 * 1024 * 1024,
    );
    setFiles((prev) => {
      const existing = prev.map((f) => f.name);
      return [...prev, ...valid.filter((f) => !existing.includes(f.name))];
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (name) =>
    setFiles((prev) => prev.filter((f) => f.name !== name));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    await onSubmit({ ...form, attachments: files });
  };

  const inputBase =
    "w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none bg-white focus:ring-2 focus:ring-[#0F3053]/20 focus:border-[#0F3053]";

  const inputClass = (field) =>
    `${inputBase} ${errors[field]
      ? "border-red-400 bg-red-50/30"
      : "border-gray-200 hover:border-gray-300"
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top brand bar */}
      <div className="h-1 w-full" style={{ backgroundColor: "#0F3053" }} />

      {/* Full-width header strip */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              disabled={loading}
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
            >
              <i className="fa-solid fa-arrow-left text-sm" />
            </button>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                style={{ backgroundColor: "#0F3053" }}
              >
                <i className="fa-solid fa-file-lines text-white text-sm" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  New Issue Request
                </h1>
                <p className="text-xs text-gray-500">
                  Fill in the details below and submit to the admin team
                </p>
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
            <i className="fa-solid fa-lock text-gray-300" />
            Your request is secure
          </div>
        </div>
      </div>

      {/* Body — wide two-column layout on desktop */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* ── LEFT COLUMN ── */}
            <div className="flex-1 space-y-5">
              {/* Section: Basic Info */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs"
                    style={{ backgroundColor: "#0F3053" }}
                  >
                    <i className="fa-solid fa-user" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-700">
                    Basic Information
                  </h2>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        placeholder="Brief summary of the issue"
                        className={inputClass("title")}
                      />
                      {errors.title && (
                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                          <i className="fa-solid fa-circle-exclamation" />{" "}
                          {errors.title}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        className={inputClass("email")}
                      />
                      {errors.email && (
                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                          <i className="fa-solid fa-circle-exclamation" />{" "}
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Issue Details */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs"
                    style={{ backgroundColor: "#0F3053" }}
                  >
                    <i className="fa-solid fa-triangle-exclamation" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-700">
                    Issue Details
                  </h2>
                </div>
                <div className="px-6 py-5 space-y-4">
                  {/* Issue Type */}
                  <div className="w-full sm:w-1/2 pr-0 sm:pr-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Request Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="issue_type"
                      value={form.issue_type}
                      onChange={handleChange}
                      className={inputClass("issue_type") + " cursor-pointer"}
                    >
                      <option value="">Select request category...</option>
                      {ISSUE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    {errors.issue_type && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <i className="fa-solid fa-circle-exclamation" />{" "}
                        {errors.issue_type}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Describe the issue in detail — include transaction IDs, dates, credit amounts, or any other relevant context..."
                      className={inputClass("description") + " resize-none"}
                    />
                    {errors.description && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <i className="fa-solid fa-circle-exclamation" />{" "}
                        {errors.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section: Additional Comments */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs"
                    style={{ backgroundColor: "#0F3053" }}
                  >
                    <i className="fa-solid fa-comment" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-700">
                    Additional Comments
                    <span className="ml-2 text-gray-400 font-normal text-xs">
                      (optional)
                    </span>
                  </h2>
                </div>
                <div className="px-6 py-5">
                  <textarea
                    name="comments"
                    value={form.comments}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Any additional notes or context for the admin team..."
                    className={`${inputBase} border-gray-200 hover:border-gray-300 resize-none`}
                  />
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="w-full lg:w-80 space-y-5 flex-shrink-0">
              {/* Attachments */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs"
                    style={{ backgroundColor: "#0F3053" }}
                  >
                    <i className="fa-solid fa-paperclip" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-700">
                    Attachments
                    <span className="ml-1 text-gray-400 font-normal text-xs">
                      (optional)
                    </span>
                  </h2>
                </div>
                <div className="px-6 py-5 space-y-3">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${dragOver
                        ? "border-[#0F3053] bg-[#0F3053]/5"
                        : "border-gray-200 hover:border-[#0F3053]/50 hover:bg-gray-50"
                      }`}
                  >
                    <i className="fa-solid fa-cloud-arrow-up text-2xl text-gray-300 mb-2 block" />
                    <p className="text-xs text-gray-600">
                      <span
                        className="font-semibold"
                        style={{ color: "#0F3053" }}
                      >
                        Click to upload
                      </span>{" "}
                      or drag & drop
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      PNG, JPG, PDF, DOCX up to 10MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      accept=".png,.jpg,.jpeg,.pdf,.docx,.doc,.xlsx,.csv"
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                  </div>

                  {files.length > 0 ? (
                    <div className="space-y-2">
                      {files.map((file) => (
                        <div
                          key={file.name}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100"
                        >
                          <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                            <i className="fa-solid fa-file text-gray-400 text-[10px]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-700 truncate">
                              {file.name}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {(file.size / 1024).toFixed(0)} KB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(file.name)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <i className="fa-solid fa-xmark text-xs" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 text-center">
                      No files attached yet
                    </p>
                  )}
                </div>
              </div>

              {/* Submission Summary */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-700">
                    Submission Summary
                  </h2>
                </div>
                <div className="px-6 py-4 space-y-2.5">
                  {[
                    { label: "Email", value: form.email || "—" },
                    {
                      label: "Issue Type",
                      value:
                        ISSUE_TYPES.find((t) => t.value === form.issue_type)
                          ?.label || "—",
                    },
                    {
                      label: "Attachments",
                      value:
                        files.length > 0
                          ? `${files.length} file${files.length > 1 ? "s" : ""}`
                          : "None",
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-gray-500">{row.label}</span>
                      <span className="font-medium text-gray-800 truncate max-w-[120px] text-right">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info box */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
                <div className="flex items-start gap-2">
                  <i className="fa-solid fa-circle-info text-blue-400 text-sm mt-0.5" />
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Your request will be reviewed by the admin team within{" "}
                    <strong>1–2 business days</strong>. You'll receive an email
                    update once it's processed.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  onClick={handleSubmit}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#0F3053" }}
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane text-xs" />
                      Submit Request
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  disabled={loading}
                  className="w-full px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Administration Page ─────────────────────────────────────────────────
export default function AdministrationPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [toasts, setToasts] = useState([]);

  const [columnWidths, setColumnWidths] = useState({
    request_id: 110,
    title: 200,
    email: 180,
    issue_type: 150,
    status: 130,
    date: 130,
    attachments: 110,
  });

  const resizingCol = useRef(null);

  const startResize = (key, e) => {
    e.preventDefault();
    resizingCol.current = {
      key,
      startX: e.clientX,
      startWidth: columnWidths[key],
    };
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!resizingCol.current) return;
      const { key, startX, startWidth } = resizingCol.current;
      setColumnWidths((prev) => ({
        ...prev,
        [key]: Math.max(80, startWidth + (e.clientX - startX)),
      }));
    };
    const onUp = () => (resizingCol.current = null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      5000,
    );
  };

  const removeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const fetchIncidents = () => {
    setLoading(true);
    getIncidents()
      .then((data) => setRequests(data.incidents ?? []))
      .catch(() => addToast("Failed to load incidents.", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const { attachments, issue_type, ...rest } = formData;
      const newRequest = await createIncident({ ...rest, category: issue_type }, attachments);
      setRequests((prev) => [newRequest, ...prev]);
      setShowForm(false);
      addToast("Issue request submitted successfully!", "success");
    } catch {
      addToast("Failed to submit request. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (val) => {
    if (!val) return "-";
    return new Date(val).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filtered = requests.filter((r) => {
    const matchSearch =
      !search.trim() ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "open").length,
    in_review: requests.filter((r) => r.status === "in_review").length,
    resolved: requests.filter((r) => r.status === "resolved").length,
  };

  // ── ListTable columns ──
  const columns = [
    { key: "request_id", label: "Request ID", sortable: true, resizable: true },
    { key: "title", label: "Title", sortable: true, resizable: true },
    { key: "email", label: "Email", sortable: true, resizable: true },
    { key: "issue_type", label: "Issue Type", sortable: true, resizable: true },
    { key: "status", label: "Status", sortable: true, resizable: true },
    { key: "date", label: "Date", sortable: true, resizable: true },
    { key: "attachments", label: "Attachments", sortable: false, resizable: true },
  ];

  const renderCell = (row, key) => {
    switch (key) {
      case "request_id":
        return (
          <span className="font-mono text-xs font-semibold text-[#0F3053] bg-blue-50 px-2 py-1 rounded-md">
            {row.request_id}
          </span>
        );
      case "title":
        return (
          <span className="text-gray-800 font-medium text-xs">{row.title}</span>
        );
      case "email":
        return <span className="text-gray-600 text-xs">{row.email}</span>;
      case "issue_type": {
        const label =
          ISSUE_TYPES.find((t) => t.value === row.issue_type)?.label ||
          row.issue_type;
        return (
          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
            {label}
          </span>
        );
      }
      case "status": {
        const s = STATUS_CONFIG[row.status] || STATUS_CONFIG.pending;
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${s.bg} ${s.text} ${s.border}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
          </span>
        );
      }
      case "date":
        return (
          <span className="text-xs text-gray-500">
            {formatDate(row.date)}
          </span>
        );
      case "attachments":
        return row.attachments?.length > 0 ? (
          <div className="flex items-center gap-1 justify-center">
            <i className="fa-solid fa-paperclip text-gray-400 text-xs" />
            <span className="text-xs text-gray-500">
              {row.attachments.length} file
              {row.attachments.length > 1 ? "s" : ""}
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        );
      default:
        return row[key] || "-";
    }
  };

  if (showForm) {
    return (
      <>
        <Toast toasts={toasts} removeToast={removeToast} />
        <IssueRequestForm
          onBack={() => setShowForm(false)}
          onSubmit={handleSubmit}
          loading={submitting}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Requests",
            value: stats.total,
            icon: "fa-list-check",
            color: "text-[#0F3053]",
            bg: "bg-blue-50",
          },
          {
            label: "Pending",
            value: stats.pending,
            icon: "fa-clock",
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "In Review",
            value: stats.in_review,
            icon: "fa-magnifying-glass",
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Resolved",
            value: stats.resolved,
            icon: "fa-circle-check",
            color: "text-green-600",
            bg: "bg-green-50",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4"
          >
            <div
              className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}
            >
              <i className={`fa-solid ${stat.icon} ${stat.color} text-base`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-card rounded-2xl border border-border shadow-sm flex flex-col h-[calc(100vh-320px)] min-h-[500px] overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between flex-shrink-0">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
              <i className="fa-solid fa-magnifying-glass text-muted-foreground text-xs" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by title, email..."
              className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg text-sm bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {["all", "pending", "in_review", "resolved", "rejected"].map(
              (s) => (
                <button
                  key={s}
                  onClick={() => {
                    setFilterStatus(s);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === s
                      ? "text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  style={
                    filterStatus === s ? { backgroundColor: "#0F3053" } : {}
                  }
                >
                  {s === "all"
                    ? "All"
                    : s
                      .replace("_", " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                </button>
              ),
            )}
            <button
              onClick={fetchIncidents}
              title="Refresh"
              className="w-10 h-10 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <i className="fa-solid fa-rotate-right" />
            </button>
            <AwsButton
              onClick={() => setShowForm(true)}
              className="flex items-center px-5 py-2.5 shadow-md transition-all transform hover:scale-[1.02]"
            >
              <HiPlus size={13} className="mr-2" />
              New Issue Request
            </AwsButton>
          </div>
        </div>

        {/* ListTable */}
        <div className="relative flex-1 overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <PageLoader loading />
            </div>
          ) : (
            <ListTable
              columns={columns}
              data={paginated}
              rowKey="request_id"
              renderCell={renderCell}
              sortConfig={sortConfig}
              onSort={(key) =>
                setSortConfig((prev) => ({
                  key,
                  direction:
                    prev.key === key && prev.direction === "asc" ? "desc" : "asc",
                }))
              }
              columnWidths={columnWidths}
              startResize={startResize}
              pagination={{
                page,
                pageSize,
                total: filtered.length,
                onPageChange: setPage,
              }}
              enableExport={true}
              exportFileName="issue-requests"
            />
          )}
        </div>
      </div>
    </div>
  );
}
