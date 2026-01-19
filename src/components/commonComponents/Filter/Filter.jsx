import "./Filter.css";

export default function Filter({ options, value, onChange, label }) {
  return (
    <label className="label">
      {label && <span className="filter-label">{label}</span>}
      <select
        className="filter-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
