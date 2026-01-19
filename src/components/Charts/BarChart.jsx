import Chart from "react-apexcharts";

export default function BarChart({ title, data, height = 360 }) {
  const categories = data.map((d) => d.name.replace(/_/g, " "));
  const values = data.map((d) => d.value);

  /* ---------------- COLOR LOGIC ---------------- */
  const getColors = () => {
    // 🔹 SCAN STATUS
    if (title === "Scan Status") {
      return categories.map((label) => {
        const l = label.toLowerCase();

        if (l.includes("not applicable")) return "#FF965D";
        if (l.includes("completed")) return "#00BFDC";

        return "#CBD5E1"; // fallback
      });
    }

    // 🔹 COMPLIANCE FOLLOWED
    if (title === "Compliance Followed") {
      return categories.map((label) => {
        const l = label.toLowerCase();

        if (l.includes("other") || l.includes("unspecified")) return "#FFD240";
        if (l.includes("gdpr")) return "#304FFD";

        return "#CBD5E1";
      });
    }

    // 🔹 TOOL STATUS
    if (title === "Tool Status") {
      return categories.map((label) => {
        const l = label.toLowerCase();

        if (l.includes("requested")) return "#FFD240";
        if (l.includes("approved for usage")) return "#008000";
        if (l.includes("scan completed")) return "#00BFDC";
        if (l.includes("rejected for usage")) return "#FF2727";
        if (l.includes("rejected for scan")) return "#FF7A7A"; // light red

        return "#CBD5E1";
      });
    }

    // default fallback
    return ["#3B82F6"];
  };

  const series = [
    {
      name: "Count",
      data: values,
    },
  ];

  const options = {
    chart: {
      type: "bar",
      toolbar: { show: false },
    },

    title: {
      text: title,
      align: "center",
      style: {
        fontSize: "16px",
        fontWeight: 600,
      },
    },

    colors: getColors(),

    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: "45%",
        distributed: true, // ✅ required for per-bar coloring
      },
    },

    xaxis: {
      categories,
      labels: {
        rotate: -45,
        formatter: (value) => {
          const max = window.innerWidth < 768 ? 7 : 10;
          return value.length > max ? value.slice(0, max) + "…" : value;
        },
      },
    },

    dataLabels: {
      enabled: true,
      style: {
        fontWeight: 600,
        colors: ["#FFFFFF"],
      },
    },

    tooltip: {
      y: {
        formatter: (val) => `${val}`,
      },
    },
  };

  return <Chart options={options} series={series} type="bar" height={height} />;
}
