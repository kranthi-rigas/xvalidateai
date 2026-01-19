import {
  Pie,
  PieChart,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#4075FB",
  "#CB30E0",
  "#00a1fb",
  "#d97706",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E2",
];

export default function SubjectWisePieChart({
  data = [],
  isAnimationActive = true,
}) {
  const legendPayload = data
    .map((subject, index) => {
      const color = COLORS[index % COLORS.length];
      return {
        id: subject.subject,
        label: `${subject.subject} (${subject.correct}/${subject.total})`,
        value: subject.total,
        color,
      };
    })
    .filter((entry) => entry.value > 0);

  const CustomLegend = ({ payload = [] }) => (
    <div style={{ padding: 8, maxWidth: 160 }}>
      {payload.map((entry) => (
        <div
          key={entry.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              background: entry.color,
              borderRadius: 2,
            }}
          />
          <div style={{ fontSize: 13, color: "#111" }}>{entry.label}</div>
        </div>
      ))}
    </div>
  );
  // Transform data for outer pie (correct answers by subject)
  const outerData = data.flatMap((subject, index) => {
    const color = COLORS[index % COLORS.length];

    return [
      {
        name: `${subject.subject} - Correct`,
        value: subject.correct,
        fill: color,
      },
      {
        name: `${subject.subject} - Incorrect`,
        value: subject.total - subject.correct,
        fill: `${color}33`,
      },
    ];
  });

  // Transform data for inner pie (percentage by subject)
  const innerData = data.map((subject) => ({
    name: `${subject.subject}`,
    value: subject.total,
    fill: COLORS[data.indexOf(subject) % COLORS.length],
  }));

  const RADIAN = Math.PI / 180;

  const renderOuterLabel = ({
    cx,
    cy,
    midAngle,
    outerRadius,
    value,
    name,
    payload,
  }) => {
    if (value <= 0) return null;

    const RADIAN = Math.PI / 180;

    // Push label OUTSIDE the pie
    const labelRadius = outerRadius + 18;

    const x = cx + labelRadius * Math.cos(-midAngle * RADIAN);
    const y = cy + labelRadius * Math.sin(-midAngle * RADIAN);

    const isRightSide = x > cx;

    const subjectTotal =
      payload?.payload?.total ?? payload?.total ?? payload?.value ?? value;

    const percent = subjectTotal
      ? ((value / subjectTotal) * 100).toFixed(1)
      : 0;

    return (
      <text
        x={x}
        y={y}
        textAnchor={isRightSide ? "start" : "end"}
        dominantBaseline="central"
        fontSize={11}
        fill="#111827"
      >
        <tspan x={x} dy="1.1em">
          {name} ({percent}%)
        </tspan>
      </text>
    );
  };

  return (
    <div className="pie-chart-container">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart margin={{ right: 160 }}>
          {/* INNER PIE → Subject ownership */}
          <Pie
            data={innerData}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={65}
            paddingAngle={2}
          >
            {innerData.map((entry, index) => (
              <Cell key={`inner-${index}`} fill={entry.fill} />
            ))}
          </Pie>

          <Pie
            data={outerData}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={95}
            paddingAngle={1}
            label={renderOuterLabel}
            labelLine={true}
          >
            {outerData.map((entry, index) => (
              <Cell key={`outer-${index}`} fill={entry.fill} />
            ))}
          </Pie>

          <Tooltip />
          <Legend
            payload={legendPayload}
            content={<CustomLegend />}
            layout="vertical"
            align="right"
            verticalAlign="middle"
            iconSize={12}
            wrapperStyle={{
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
