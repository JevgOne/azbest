"use client";

import { Area, AreaChart as RechartsAreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface AreaChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
}

export function AreaChart({ data, xKey, yKey, color = "#2563eb", height = 300 }: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey={xKey} className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip />
        <Area type="monotone" dataKey={yKey} stroke={color} fill={color} fillOpacity={0.1} />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
