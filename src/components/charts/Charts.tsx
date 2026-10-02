"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_SERIES } from "@/lib/tokens";

const AXIS = { fontSize: 12, fill: "rgb(var(--muted))" } as const;

interface TooltipEntry {
  name?: string | number;
  value?: string | number;
  color?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
  suffix,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  suffix?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-elevated px-3 py-2 text-xs shadow-popover">
      {label !== undefined ? (
        <p className="mb-1 font-semibold text-fg">{label}</p>
      ) : null}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-muted">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: entry.color }}
          />
          <span className="text-fg">
            {entry.name}: <strong>{entry.value}</strong>
            {suffix ?? ""}
          </span>
        </div>
      ))}
    </div>
  );
}

export interface TrendPoint {
  label: string;
  projects: number;
  gap: number;
}

export function HealthTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="gradProjects" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis
          yAxisId="left"
          tick={AXIS}
          tickLine={false}
          axisLine={false}
          width={32}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={AXIS}
          tickLine={false}
          axisLine={false}
          width={36}
        />
        <Tooltip content={<ChartTooltip />} />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="projects"
          name="Active Projects"
          stroke="#2563eb"
          strokeWidth={2.5}
          fill="url(#gradProjects)"
          dot={{ r: 3, strokeWidth: 0, fill: "#2563eb" }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="gap"
          name="FTE Gap"
          stroke="#e11d48"
          strokeWidth={2.5}
          dot={{ r: 3, strokeWidth: 0, fill: "#e11d48" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  data,
  centerLabel,
  centerValue,
  height = 220,
}: {
  data: DonutSlice[];
  centerLabel?: string;
  centerValue?: string;
  height?: number;
}) {
  const total = data.reduce((a, b) => a + b.value, 0);
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={total === 0 ? [{ label: "None", value: 1, color: "#e2e8f0" }] : data}
            dataKey="value"
            nameKey="label"
            innerRadius="62%"
            outerRadius="90%"
            paddingAngle={data.length > 1 ? 2 : 0}
            stroke="none"
          >
            {(total === 0 ? [{ color: "#e2e8f0" }] : data).map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {centerValue !== undefined ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-fg tabular-nums">
            {centerValue}
          </span>
          {centerLabel ? (
            <span className="text-xs text-muted">{centerLabel}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export interface CategoryDatum {
  label: string;
  value: number;
}

export function VerticalBarChart({
  data,
  color = CHART_SERIES[0],
  height = 240,
  suffix,
}: {
  data: CategoryDatum[];
  color?: string;
  height?: number;
  suffix?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 16, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={AXIS}
          tickLine={false}
          axisLine={false}
          interval={0}
          angle={data.length > 6 ? -18 : 0}
          textAnchor={data.length > 6 ? "end" : "middle"}
          height={data.length > 6 ? 54 : 30}
        />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
        <Tooltip content={<ChartTooltip suffix={suffix} />} cursor={{ fill: "rgb(var(--surface-2))" }} />
        <Bar dataKey="value" name="Count" radius={[6, 6, 0, 0]} maxBarSize={54}>
          {data.map((_, i) => (
            <Cell key={i} fill={color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export interface HBarDatum {
  label: string;
  value: number;
  color?: string;
}

export function HorizontalBarChart({
  data,
  height = 260,
  suffix,
}: {
  data: HBarDatum[];
  height?: number;
  suffix?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="label"
          tick={AXIS}
          tickLine={false}
          axisLine={false}
          width={120}
        />
        <Tooltip content={<ChartTooltip suffix={suffix} />} cursor={{ fill: "rgb(var(--surface-2))" }} />
        <Bar dataKey="value" name="Value" radius={[0, 6, 6, 0]} maxBarSize={22}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color ?? CHART_SERIES[i % CHART_SERIES.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export interface GroupedDatum {
  label: string;
  need: number;
  actual: number;
}

/** Side-by-side bars comparing two series (e.g. FTE need vs. actual). */
export function GroupedBarChart({
  data,
  height = 240,
  needColor = "#2563eb",
  actualColor = "#93c5fd",
}: {
  data: GroupedDatum[];
  height?: number;
  needColor?: string;
  actualColor?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 16, right: 8, left: -12, bottom: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={AXIS}
          tickLine={false}
          axisLine={false}
          interval={0}
          angle={data.length > 6 ? -18 : 0}
          textAnchor={data.length > 6 ? "end" : "middle"}
          height={data.length > 6 ? 54 : 30}
        />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgb(var(--surface-2))" }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Bar dataKey="need" name="FTE Need" fill={needColor} radius={[5, 5, 0, 0]} maxBarSize={28} />
        <Bar dataKey="actual" name="FTE Actual" fill={actualColor} radius={[5, 5, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
