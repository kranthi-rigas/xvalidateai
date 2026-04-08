import React, { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";
import ReusableModal from "@/components/common/Reusablemodal";
import COLORS from "@/styles/colors";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function PdfViewerModal({ isOpen, onClose, doc, onDownload }) {
  const [pdfDoc, setPdfDoc]       = useState(null);
  const [numPages, setNumPages]   = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale]         = useState(1.4);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const canvasRefs      = useRef([]);
  const pageWrapperRefs = useRef([]);
  const observerRef     = useRef(null);

  /* ── Load PDF when doc/isOpen changes ─────────────────────────────────── */
  useEffect(() => {
    if (!isOpen || !doc) {
      setPdfDoc(null);
      setNumPages(0);
      setCurrentPage(1);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setPdfDoc(null);
    setNumPages(0);
    setCurrentPage(1);

    (async () => {
      try {
        const resp = await fetch(`/documents/${doc.file}`);
        if (!resp.ok) throw new Error("Failed to load document.");
        const buf = await resp.arrayBuffer();
        const loaded = await pdfjsLib.getDocument({ data: buf }).promise;
        if (!cancelled) {
          setPdfDoc(loaded);
          setNumPages(loaded.numPages);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load document.");
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [isOpen, doc]);

  /* ── Render pages when pdfDoc or scale changes ─────────────────────────── */
  useEffect(() => {
    if (!pdfDoc) return;
    let cancelled = false;

    (async () => {
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        if (cancelled) break;
        try {
          const page = await pdfDoc.getPage(i);
          const vp   = page.getViewport({ scale });
          const canvas = canvasRefs.current[i - 1];
          if (!canvas) continue;
          canvas.width  = vp.width;
          canvas.height = vp.height;
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport: vp }).promise;
        } catch (_) { /* page render errors are non-fatal */ }
      }
    })();

    return () => { cancelled = true; };
  }, [pdfDoc, scale]);

  /* ── IntersectionObserver — track current page ─────────────────────────── */
  useEffect(() => {
    if (!numPages) return;

    if (observerRef.current) observerRef.current.disconnect();

    const ratios = new Array(numPages).fill(0);

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = parseInt(entry.target.dataset.pageIndex, 10);
          ratios[idx] = entry.intersectionRatio;
        });
        const best = ratios.indexOf(Math.max(...ratios));
        setCurrentPage(best + 1);
      },
      { threshold: Array.from({ length: 11 }, (_, i) => i / 10) }
    );

    pageWrapperRefs.current.forEach((el) => {
      if (el) observerRef.current.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [numPages]);

  /* ── Helpers ────────────────────────────────────────────────────────────── */
  const scrollToPage = (pageNum) => {
    const el = pageWrapperRefs.current[pageNum - 1];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const zoomIn  = () => setScale((s) => Math.min(+(s + 0.2).toFixed(1), 3.0));
  const zoomOut = () => setScale((s) => Math.max(+(s - 0.2).toFixed(1), 0.6));

  /* ── Icon button style ──────────────────────────────────────────────────── */
  const iconBtn = (color = COLORS.textSecondary) => ({
    background: "none",
    border: "none",
    cursor: "pointer",
    color,
    padding: "6px 10px",
    borderRadius: 6,
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    gap: 4,
    transition: "background 0.15s",
  });

  /* ── Footer ─────────────────────────────────────────────────────────────── */
  const footer = doc && onDownload && (
    <button
      onClick={() => onDownload(doc)}
      style={{
        padding: "9px 20px",
        fontSize: 13,
        fontWeight: 600,
        color: "#fff",
        background: COLORS.primary,
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 7,
      }}
    >
      <i className="fa-solid fa-download" />
      Download
    </button>
  );

  return (
    <ReusableModal
      isOpen={isOpen}
      onClose={onClose}
      title={doc?.title}
      size="full"
      closeOnOverlayClick={false}
      footer={footer}
    >
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "sticky",
          top: -20,        // counteracts modal's 20px padding
          zIndex: 10,
          background: COLORS.bgSecondary,
          borderBottom: `1px solid ${COLORS.borderLight}`,
          borderRadius: "8px 8px 0 0",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: 4,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        {/* Page navigation */}
        <button
          style={iconBtn()}
          disabled={currentPage <= 1 || !numPages}
          onClick={() => scrollToPage(currentPage - 1)}
          title="Previous page"
          onMouseOver={(e) => (e.currentTarget.style.background = COLORS.borderLight)}
          onMouseOut={(e)  => (e.currentTarget.style.background = "none")}
        >
          <i className="fa-solid fa-chevron-left" />
        </button>

        <span style={{ fontSize: 13, color: COLORS.textSecondary, minWidth: 80, textAlign: "center" }}>
          {numPages ? `Page ${currentPage} / ${numPages}` : "—"}
        </span>

        <button
          style={iconBtn()}
          disabled={currentPage >= numPages || !numPages}
          onClick={() => scrollToPage(currentPage + 1)}
          title="Next page"
          onMouseOver={(e) => (e.currentTarget.style.background = COLORS.borderLight)}
          onMouseOut={(e)  => (e.currentTarget.style.background = "none")}
        >
          <i className="fa-solid fa-chevron-right" />
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: COLORS.borderLight, margin: "0 8px" }} />

        {/* Zoom */}
        <button
          style={iconBtn()}
          onClick={zoomOut}
          disabled={scale <= 0.6}
          title="Zoom out"
          onMouseOver={(e) => (e.currentTarget.style.background = COLORS.borderLight)}
          onMouseOut={(e)  => (e.currentTarget.style.background = "none")}
        >
          <i className="fa-solid fa-minus" />
        </button>

        <span style={{ fontSize: 12, color: COLORS.textSecondary, minWidth: 40, textAlign: "center" }}>
          {Math.round(scale * 100)}%
        </span>

        <button
          style={iconBtn()}
          onClick={zoomIn}
          disabled={scale >= 3.0}
          title="Zoom in"
          onMouseOver={(e) => (e.currentTarget.style.background = COLORS.borderLight)}
          onMouseOut={(e)  => (e.currentTarget.style.background = "none")}
        >
          <i className="fa-solid fa-plus" />
        </button>
      </div>

      {/* ── Content area ────────────────────────────────────────────────── */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px 0", color: COLORS.textMuted, fontSize: 14 }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }} />
          Loading document…
        </div>
      )}

      {error && (
        <div style={{ textAlign: "center", padding: "60px 0", color: COLORS.error, fontSize: 14 }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 8 }} />
          {error}
        </div>
      )}

      {!loading && !error && numPages > 0 && (
        <div style={{ overflowX: "auto" }}>
          {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
            <div key={pageNum}>
              <div
                ref={(el) => { pageWrapperRefs.current[pageNum - 1] = el; }}
                data-page-index={pageNum - 1}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 8 }}
              >
                <span style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6, letterSpacing: "0.05em" }}>
                  PAGE {pageNum}
                </span>
                <canvas
                  ref={(el) => { canvasRefs.current[pageNum - 1] = el; }}
                  style={{
                    display: "block",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
                    borderRadius: 4,
                    maxWidth: "100%",
                  }}
                />
              </div>
              {pageNum < numPages && (
                <div style={{ height: 1, background: COLORS.borderLight, margin: "12px 0" }} />
              )}
            </div>
          ))}
        </div>
      )}
    </ReusableModal>
  );
}
