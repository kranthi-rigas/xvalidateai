import React, { useCallback, useEffect, useRef, useState } from "react";
import { COLORS } from "@/styles/colors";
import AwsButton from "@/components/common/AwsButton";
import {
  listDocuments,
  uploadDocument,
  getDocumentUrl,
} from "@/apiIntegration/documents";
import useToast from "@/hooks/useToast";

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

const formatSize = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

export default function MyDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const show = useToast();

  const load = useCallback(async () => {
    try {
      const data = await listDocuments();
      setDocuments(data?.documents || []);
      setError("");
    } catch (err) {
      console.warn("Could not load documents:", err);
      setDocuments([]);
      setError("Your documents could not be loaded.");
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    // Reset immediately so picking the same file twice still fires onChange.
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_FILE_BYTES) {
      show(
        `"${file.name}" is ${formatSize(file.size)} — larger than the ${formatSize(
          MAX_FILE_BYTES,
        )} limit.`,
        { type: "error" },
      );
      return;
    }

    setUploading(true);
    setError("");
    try {
      await uploadDocument(file);
      await load();
    } catch (err) {
      setError(err?.message || "The file could not be uploaded.");
    } finally {
      setUploading(false);
    }
  };

  const handleOpen = async (doc) => {
    try {
      const { download_url } = await getDocumentUrl(doc.document_id);
      window.open(download_url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err?.message || "That document could not be opened.");
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", color: COLORS.textMuted, padding: 40 }}>
        Loading your documents…
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <div style={{ color: COLORS.textMuted, fontSize: 14 }}>
          {documents.length
            ? `${documents.length} ${documents.length === 1 ? "document" : "documents"}`
            : "Only you can see the documents you upload here."}
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFile}
            style={{ display: "none" }}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg"
          />
          <AwsButton
            onClick={() => fileInputRef.current?.click()}
            loading={uploading}
          >
            <i className="fa-solid fa-upload" />
            {uploading ? "Uploading…" : "Upload document"}
          </AwsButton>
        </div>
      </div>

      {error && (
        <div
          style={{
            border: "1px solid #fecaca",
            background: "#fef2f2",
            color: "#b91c1c",
            borderRadius: 10,
            padding: "12px 16px",
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {documents.length === 0 ? (
        <div
          style={{
            border: `1px dashed ${COLORS.borderLight}`,
            borderRadius: 12,
            padding: "56px 24px",
            textAlign: "center",
            background: COLORS.bgPrimary,
          }}
        >
          <div style={{ fontSize: 32, color: COLORS.textMuted, marginBottom: 12 }}>
            <i className="fa-regular fa-folder-open" />
          </div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 16,
              color: COLORS.textPrimary,
              marginBottom: 6,
            }}
          >
            No documents yet
          </div>
          <div style={{ color: COLORS.textMuted, fontSize: 14 }}>
            Upload a document to keep it here. PDF, Word, Excel, PowerPoint,
            text and image files up to {formatSize(MAX_FILE_BYTES)}.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {documents.map((doc) => (
            <div
              key={doc.document_id}
              style={{
                border: `1px solid ${COLORS.borderLight}`,
                borderRadius: 12,
                padding: "16px 20px",
                background: COLORS.bgPrimary,
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#eef2f7",
                  color: COLORS.primary,
                  flexShrink: 0,
                }}
              >
                <i className="fa-regular fa-file-lines" />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    color: COLORS.textPrimary,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {doc.filename}
                </div>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                  {formatDate(doc.created_at)}
                  {doc.upload_status === "pending" && " · upload incomplete"}
                </div>
              </div>

              <button
                onClick={() => handleOpen(doc)}
                title="Open document"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  border: `1px solid ${COLORS.borderLight}`,
                  background: COLORS.bgPrimary,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: COLORS.primary,
                  flexShrink: 0,
                }}
              >
                <i className="fa-solid fa-arrow-up-right-from-square" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
