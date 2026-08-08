import Select from "react-select";
import { components } from "react-select";

/* -------- OPTION (Dropdown list) -------- */
const CountryOption = ({ data, innerRef, innerProps, isFocused }) => (
  <div
    ref={innerRef}
    {...innerProps}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 12px",
      background: isFocused ? "#EEF2FF" : "#fff",
      cursor: "pointer",
      color: "#0F172A",
    }}
  >
    <img src={data.flag} alt="" width={20} height={14} />
    <span>{data.label}</span>
  </div>
);

const CenteredValueContainer = ({ children, ...props }) => (
  <components.ValueContainer {...props}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: "100%",
        width: "100%",
      }}
    >
      {children}
    </div>
  </components.ValueContainer>
);

/* -------- SELECTED VALUE (Control) -------- */
const CountrySingleValue = ({ data }) => (
  <div
    title={data.label}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      width: "100%",
      overflow: "hidden",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      color: "#0F172A",
    }}
  >
    <img src={data.flag} alt="" width={20} height={14} />
    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
      {data.label}
    </span>
  </div>
);

export default function CountrySelect({
  countries,
  value,
  onChange,
  height = 48,
  ...rest
}) {
  const customStyles = {
    control: (base) => ({
      ...base,
      height,
      minHeight: height,
      borderRadius: 8,
      backgroundColor: "transparent",
      border: "1px solid #DDDDDD",
      boxShadow: "none",
      cursor: "pointer",
    }),

    valueContainer: (base) => ({
      ...base,
      height,
      padding: "0 12px",
      display: "flex",
      alignItems: "center",
    }),

    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
    }),

    singleValue: (base) => ({
      ...base,
      position: "static",
      transform: "none",
      margin: 0,
      display: "flex",
      alignItems: "center",
      maxWidth: "100%",
    }),

    indicatorsContainer: (base) => ({
      ...base,
      height,
      alignItems: "center",
    }),

    indicatorSeparator: () => ({
      display: "none",
    }),

    menu: (base) => ({
      ...base,
      zIndex: 9999,
    }),

    menuPortal: (base) => ({
      ...base,
      zIndex: 99999,
    }),
  };

  return (
    <Select
      classNamePrefix="react-select"
      options={countries}
      value={value}
      onChange={onChange}
      isSearchable
      isClearable={true}
      placeholder="Select country"
      getOptionValue={(o) => o.value}
      getOptionLabel={(o) => o.label}
      components={{
        Option: CountryOption,
        SingleValue: CountrySingleValue,
        ValueContainer: CenteredValueContainer,
      }}
      styles={customStyles}
      {...rest}
    />
  );
}
