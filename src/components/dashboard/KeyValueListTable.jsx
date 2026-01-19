export default function KeyValueListTable({
  title = "Details",
  data = [],
  nameHeader = "Description",
  valueHeader = "Count",
}) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="empty-state-charts">
        <div className="fw-600 mb-6">No data available</div>
        <div>Records will appear once data is available</div>
      </div>
    );
  }

  return (
    <div className="charts-main">
      <div className="mb-20">
        <h5>{title}</h5>
      </div>

      {/* Table */}
      <div>
        <table class="list_main">
          <thead>
            <tr>
              <th className="list-header">{nameHeader}</th>
              <th className="list-header">{valueHeader}</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item, index) => {
              const isEven = index % 2 === 0;

              return (
                <tr
                  key={index}
                  style={{
                    background: isEven ? "#FFFFFF" : "#F9FAFB",
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#EEF2FF")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = isEven
                      ? "#FFFFFF"
                      : "#F9FAFB")
                  }
                >
                  {/* Description */}
                  <td className="description">{item.name}</td>

                  {/* Value badge */}
                  <td className="value-container">
                    <span className="value">{item.value}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
