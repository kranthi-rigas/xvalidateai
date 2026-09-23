import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * A select you can type into. The list always opens below the field — a native
 * <select> flips its menu upward when it is near the bottom of the window,
 * which puts the options over the field the person just clicked.
 *
 * `options` is a list of [value, label] pairs, the same shape the country and
 * subdivision data uses.
 */
export default function SearchableSelect({
  id,
  name,
  value,
  options = [],
  onChange,
  placeholder = "Select",
  searchPlaceholder = "Type to search…",
  hasError = false,
  disabled = false,
  ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  const wrapperRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  const selectedLabel = useMemo(
    () => options.find(([code]) => code === value)?.[1] || "",
    [options, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;

    // Matches are ranked, not just filtered: typing "US" has to put United
    // States first, ahead of the Australias and Belaruses that merely contain
    // those letters somewhere in the middle.
    const rank = ([code, label]) => {
      const c = code.toLowerCase();
      const l = label.toLowerCase();
      if (c === q) return 0; // the code itself
      if (c.startsWith(q)) return 1;
      if (l.startsWith(q)) return 2; // name starts with what was typed
      if (l.includes(` ${q}`)) return 3; // start of a later word
      if (l.includes(q)) return 4; // anywhere in the name
      return -1;
    };

    return options
      .map((option) => ({ option, score: rank(option) }))
      .filter(({ score }) => score >= 0)
      .sort((a, b) => a.score - b.score) // ties keep A–Z order
      .map(({ option }) => option);
  }, [options, query]);

  // Opening lands on the current selection, so arrow keys start from there.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    const index = filtered.findIndex(([code]) => code === value);
    setHighlight(index >= 0 ? index : 0);
    searchRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.children?.[highlight];
    node?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  const choose = (code) => {
    onChange?.({ target: { name, value: code } });
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) return setOpen(true);
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (!open) return setOpen(true);
      const option = filtered[highlight];
      if (option) choose(option[0]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const fieldStyle = {
    border: hasError ? "1px solid #dc3545" : "1px solid #dddddd",
    borderRadius: 8,
    padding: "11px 14px",
    fontSize: 14,
    width: "100%",
    height: 44,
    background: disabled ? "#f4f4f4" : "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    cursor: disabled ? "not-allowed" : "pointer",
    textAlign: "left",
    color: selectedLabel ? "#161616" : "#8d8d8d",
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        style={fieldStyle}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {selectedLabel || placeholder}
        </span>
        {/* data-fa-i2svg="false": this app loads FontAwesome's CSS and its JS
            engine, and without the opt-out both draw the icon. */}
        <i
          className={`fa-solid fa-chevron-${open ? "up" : "down"}`}
          data-fa-i2svg="false"
          aria-hidden="true"
          style={{ fontSize: 11, color: "#6b7280", flexShrink: 0 }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)", // always below the field
            left: 0,
            right: 0,
            zIndex: 60,
            background: "#fff",
            border: "1px solid #e4e7ea",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(15, 48, 83, 0.12)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlight(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              style={{
                width: "100%",
                border: "1px solid #dddddd",
                borderRadius: 6,
                padding: "8px 10px",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>

          <div
            ref={listRef}
            role="listbox"
            style={{ maxHeight: 220, overflowY: "auto", padding: 4 }}
          >
            {filtered.length === 0 && (
              <div
                style={{ padding: "10px 12px", fontSize: 14, color: "#8d8d8d" }}
              >
                No matches
              </div>
            )}
            {filtered.map(([code, label], index) => {
              const isSelected = code === value;
              const isHighlighted = index === highlight;
              return (
                <div
                  key={code}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlight(index)}
                  onClick={() => choose(code)}
                  style={{
                    padding: "8px 12px",
                    fontSize: 14,
                    borderRadius: 6,
                    cursor: "pointer",
                    background: isHighlighted ? "#e3edfd" : "transparent",
                    color: isSelected ? "#0F3053" : "#161616",
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
