import React, { useEffect, useState } from "react";
import { getObservationArtifact } from "@/apiIntegration/verification";
import { S } from "./evidenceStyles";

/**
 * Readable view of one recorded check.
 *
 * The raw artifact is still available, but handing someone a JSON file and
 * calling it evidence puts the work of reading it on them. What a reviewer
 * needs is the breach, the CVE, the tracker - named, dated and linked. The
 * JSON stays one click away for anyone who has to audit the capture itself.
 */

const CHECK_LABELS = {
  SECURITY_INCIDENT: "Breach and vulnerability check",
  WEB_CAPTURE: "What the product loads",
  EXTENSION_LISTING: "Chrome Web Store listing",
  PRIVACY_POLICY: "Privacy policy",
  TERMS_OF_SERVICE: "Terms of service",
  DPA: "Data processing addendum",
  SUBPROCESSOR_LIST: "Subprocessor list",
  SECURITY_PAGE: "Security page",
  STUDENT_DATA_ADDENDUM: "Student data addendum",
};

const fmtDate = (v) => {
  if (!v) return "--";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString();
};

const num = (v) => (typeof v === "number" ? v.toLocaleString() : v || "--");

function Section({ title, count, children }) {
  return (
    <div style={S.section}>
      <div className="text-light-1" style={S.sectionTitle}>
        {title}
        {count != null ? ` (${count})` : ""}
      </div>
      {children}
    </div>
  );
}

function Empty({ children }) {
  return <p className="text-light-1" style={{ fontSize: 13, margin: 0 }}>{children}</p>;
}

function Breaches({ items }) {
  if (!items?.length) return (
    <Empty>
      No breach for this vendor in Have I Been Pwned. That database is
      curated rather than exhaustive and regional coverage varies, so
      this does not establish that none has occurred.
    </Empty>
  );
  return (
    <div style={S.stack}>
      {items.map((b, i) => (
        <div key={b.id || i} style={S.card}>
          <div className="text-dark-1" style={S.cardTitle}>{b.title || b.id}</div>
          <div className="text-light-1" style={S.cardLine}>
            Breach dated {fmtDate(b.breach_date)} · {num(b.pwn_count)} accounts
            {b.is_verified === false ? " · unverified" : ""}
          </div>
          {b.data_classes?.length ? (
            <div className="text-dark-1" style={S.cardLine}>
              Exposed: {b.data_classes.join(", ")}
            </div>
          ) : null}
          {b.description_url ? (
            <a
              href={b.description_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600" style={{ fontSize: 12 }}
            >
              Source
            </a>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function Vulnerabilities({ items }) {
  if (!items?.length) return (
    <Empty>
      No CVEs published in the window checked. The search matches the
      vendor name in NVD, so a vulnerability recorded under a product or
      parent-company name may not appear.
    </Empty>
  );
  return (
    <div style={S.tableWrap}>
      <table style={S.table}>
        <thead>
          <tr className="text-light-1">
            <th style={S.th}>CVE</th>
            <th style={S.th}>Severity</th>
            <th style={S.th}>Published</th>
            <th style={S.th}>Summary</th>
          </tr>
        </thead>
        <tbody>
          {items.map((v, i) => (
            <tr key={v.cve_id || v.id || i}>
              <td style={S.tdNoWrap}>
                {v.url ? (
                  <a href={v.url} target="_blank" rel="noopener noreferrer"
                     className="text-blue-600">
                    {v.cve_id || v.id}
                  </a>
                ) : (v.cve_id || v.id)}
              </td>
              <td style={S.td}>{v.severity || "unrated"}</td>
              <td style={S.tdNoWrap}>
                {fmtDate(v.published)}
              </td>
              <td style={S.td} className="text-light-1">
                {(v.summary || "").slice(0, 220)}
                {(v.summary || "").length > 220 ? "…" : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HostList({ items, emptyText }) {
  if (!items?.length) return <Empty>{emptyText}</Empty>;
  return (
    <div style={S.chipRow}>
      {items.map((t, i) => (
        <span
          key={t.host || t.id || i}
          className="text-light-1" style={S.chip}
        >
          {t.host || t.key || t.id}
          {t.category ? ` · ${t.category.toLowerCase().replace("_", " ")}` : ""}
        </span>
      ))}
    </div>
  );
}

export default function EvidenceDetail({ observation, onClose }) {
  const [rawBusy, setRawBusy] = useState(false);
  const [rawError, setRawError] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!observation) return null;
  const s = observation.summary || {};
  const type = observation.check_type;

  const openRaw = async () => {
    setRawBusy(true);
    setRawError("");
    try {
      const data = await getObservationArtifact(observation.observation_id);
      window.open(data.artifact_url, "_blank", "noopener");
    } catch (e) {
      setRawError(e?.message || "Could not open the raw capture.");
    } finally {
      setRawBusy(false);
    }
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div
        className="bg-white rounded-16 shadow-4"
        style={S.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div style={S.header}>
          <div style={S.headerText}>
            <h3 className="text-dark-1" style={S.title}>
              {CHECK_LABELS[type] || type}
            </h3>
            <div className="text-light-1" style={S.subtitle}>
              {observation.subject_id} · checked {fmtDate(observation.captured_at)}
              {s.capture_method ? ` · ${s.capture_method === "BROWSER"
                ? "full browser session" : "HTTP request only"}` : ""}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-light-1" style={S.close}>
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div style={S.body}>
          {/* A partial check is not a clean result and must never read as one. */}
          {s.partial && (
            <div className="badge-warning" style={S.notice}>
              <p style={{ margin: 0 }}>
                This check was incomplete — {Object.keys(s.source_errors || {}).join(", ")}{" "}
                could not be reached. Nothing here rules out what those sources
                would have reported.
              </p>
            </div>
          )}

          {s.capture_method === "HTTP_STATIC" && (
            <div style={S.notice}>
              <p className="text-light-1" style={{ margin: 0 }}>
                Captured without a browser, so anything loaded by JavaScript is
                not represented here.
              </p>
            </div>
          )}

          {type === "SECURITY_INCIDENT" && (
            <>
              <Section title="Known breaches" count={(s.breaches || []).length}>
                <Breaches items={s.breaches} />
              </Section>
              <Section title="Published vulnerabilities"
                       count={(s.vulnerabilities || []).length}>
                <Vulnerabilities items={s.vulnerabilities} />
              </Section>
            </>
          )}

          {type === "WEB_CAPTURE" && (
            <>
              <Section title="Advertising and ad-tech"
                       count={(s.advertising_trackers || []).length}>
                <HostList items={s.advertising_trackers}
                          emptyText="No advertising or ad-tech domains observed." />
              </Section>
              <Section title="Other trackers" count={(s.trackers || []).length}>
                <HostList items={s.trackers} emptyText="No analytics, session replay or support trackers observed." />
              </Section>
              <Section title="Cookies set" count={(s.cookies || []).length}>
                <HostList items={(s.cookies || []).map((c) => ({ host: c.name }))}
                          emptyText="No cookies set." />
              </Section>
              <Section title="Browser storage" count={(s.storage_keys || []).length}>
                <HostList items={s.storage_keys} emptyText="Nothing written to browser storage." />
              </Section>
              <Section title="All third-party origins"
                       count={(s.third_party_origins || []).length}>
                <HostList items={s.third_party_origins} emptyText="No third-party origins contacted." />
              </Section>
              {s.missing_security_headers?.length ? (
                <Section title="Security headers missing">
                  <HostList items={s.missing_security_headers.map((h) => ({ host: h }))} />
                </Section>
              ) : null}
            </>
          )}

          {type === "EXTENSION_LISTING" && (
            <>
              <Section title="Store declarations">
                <ul className="text-dark-1" style={S.list}>
                  <li>Data not sold to third parties: {s.declares_not_sold ? "declared" : "NOT declared"}</li>
                  <li>Limited use of data: {s.declares_limited_use ? "declared" : "NOT declared"}</li>
                  <li>Not used for creditworthiness: {s.declares_no_creditworthiness ? "declared" : "NOT declared"}</li>
                </ul>
              </Section>
              <Section title="Data the extension handles" count={(s.data_types || []).length}>
                <HostList items={(s.data_types || []).map((d) => ({ host: d }))}
                          emptyText="No data categories declared." />
              </Section>
              <Section title="Version">
                <p className="text-dark-1" style={{ fontSize: 14, margin: 0 }}>{s.version || "unknown"}</p>
              </Section>
            </>
          )}

          {["PRIVACY_POLICY", "TERMS_OF_SERVICE", "DPA", "SUBPROCESSOR_LIST",
            "SECURITY_PAGE", "STUDENT_DATA_ADDENDUM"].includes(type) && (
            <Section title="Document captured">
              <p className="text-dark-1" style={{ fontSize: 14, margin: 0 }}>{s.title || s.url}</p>
              <p className="text-light-1" style={{ fontSize: 13, marginTop: 6 }}>
                {num(s.text_length)} characters of text.{" "}
                {s.archive_url ? (
                  <a href={s.archive_url} target="_blank" rel="noopener noreferrer"
                     className="text-blue-600">
                    Independent archive copy
                  </a>
                ) : "No independent archive copy was taken."}
              </p>
            </Section>
          )}

          <div className="admin-actions" style={S.footer}>
            <button
              type="button"
              onClick={openRaw}
              disabled={rawBusy}
              className="text-blue-600" style={S.linkButton}
            >
              {rawBusy ? "Opening…" : "Download the raw capture (JSON)"}
            </button>
            <p className="text-light-1" style={{ fontSize: 12, marginTop: 6 }}>
              The exact response this check was based on, for anyone auditing
              the capture itself.
            </p>
            {rawError && <p className="text-red-600" style={{ fontSize: 13, marginTop: 8 }}>{rawError}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
