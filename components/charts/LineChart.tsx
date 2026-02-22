"use client";

import { Line, LineChart as RechartsLineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface LineChartProps {
  data: any[];
  xKey: string;
  yKeys: { key: string; color: string; name?: string }[];
  height?: number;
}

export function LineChart({ data, xKey, yKeys, height = 300 }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey={xKey} className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip />
        {yKeys.map((yKey) => (
          <Line key={yKey.key} type="monotone" dataKey={yKey.key} stroke={yKey.color} name={yKey.name || yKey.key} strokeWidth={2} dot={false} />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
