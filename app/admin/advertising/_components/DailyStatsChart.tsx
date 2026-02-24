"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface DailyStatsChartProps {
  data: { date: string; impressions: number; clicks: number; spend: number; conversions: number }[];
  title?: string;
  metric?: "spend" | "clicks" | "impressions" | "conversions";
}

const METRIC_CONFIG = {
  spend: { label: "Útrata (Kč)", color: "#4285F4", formatter: (v: number) => `${v.toLocaleString("cs-CZ")} Kč` },
  clicks: { label: "Kliknutí", color: "#34A853", formatter: (v: number) => v.toLocaleString("cs-CZ") },
  impressions: { label: "Zobrazení", color: "#FBBC04", formatter: (v: number) => v.toLocaleString("cs-CZ") },
  conversions: { label: "Konverze", color: "#EA4335", formatter: (v: number) => v.toLocaleString("cs-CZ") },
};

export function DailyStatsChart({ data, title, metric = "spend" }: DailyStatsChartProps) {
  const config = METRIC_CONFIG[metric];

  if (!data?.length) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title || config.label}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getDate()}.${d.getMonth() + 1}.`;
              }}
            />
            <YAxis className="text-xs" tickFormatter={(v) => v.toLocaleString("cs-CZ")} />
            <Tooltip
              formatter={(value) => [config.formatter(Number(value)), config.label]}
              labelFormatter={(label) => {
                const d = new Date(label);
                return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
              }}
            />
            <Area
              type="monotone"
              dataKey={metric}
              stroke={config.color}
              fill={config.color}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
