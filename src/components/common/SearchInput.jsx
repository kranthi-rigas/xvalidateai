import React, { useRef } from "react";

/**
 * Toolbar search box shared by the list pages.
 *
 * autoComplete is off and the input has its own name: without that, Chrome
 * treated this box and the email field in a modal on the same page as one
 * form and autofilled whatever email was typed there into the search.
 */
export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}) {
  const inputRef = useRef(null);

  const clear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <i className="fa-solid fa-magnifying-glass text-muted-foreground text-sm" />
      </div>

      <input
        ref={inputRef}
        type="text"
        name="list-search"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && value && clear()}
        placeholder={placeholder}
        aria-label={placeholder}
        className="block w-full pl-11 pr-9 py-2.5 border border-border rounded-lg text-sm bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm appearance-none"
      />

      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          title="Clear search"
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <i className="fa-solid fa-xmark text-sm" />
        </button>
      )}
    </div>
  );
}
