"use client";

import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface BarChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
}

export function BarChart({ data, xKey, yKey, color = "#2563eb", height = 300 }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey={xKey} className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip />
        <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
