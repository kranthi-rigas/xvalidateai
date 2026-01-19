import React from "react";
import {
  AreaChart,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Area,
} from "recharts";

export default function AttemptWiseAreaChart({ fullData }) {
  const attempts = fullData?.data?.charts?.line?.score_trend || [];

  const chartData = attempts.map((item, index) => ({
    name: `Attempt ${item.attempt ?? index + 1}`,
    value: item.score ?? 0,
  }));

  return (
    <div className="area-chart-container">
      <ResponsiveContainer height={280} width="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#336CFB" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#336CFB" stopOpacity={0.08} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#F1F3F5" vertical={false} />

          <XAxis dataKey="name" axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />

          <Tooltip />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#3B82F680"
            fillOpacity={1}
            strokeWidth={2}
            fill="url(#lineGradient)"
            activeDot={{ r: 6 }}
            dot={{ r: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
