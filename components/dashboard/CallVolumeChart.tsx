"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CallVolumeChartProps {
  data: Array<{ date: string; count: number }>;
}

export default function CallVolumeChart({ data }: CallVolumeChartProps) {
  return (
    <ResponsiveContainer width="100%" height={256}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00A99D" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#00A99D" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#8AADA6", fontSize: 11 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#8AADA6", fontSize: 11 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #D0EDE8",
            borderRadius: "8px",
            boxShadow: "0 4px 20px rgba(0,169,157,0.15)",
          }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#00A99D"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorCalls)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
