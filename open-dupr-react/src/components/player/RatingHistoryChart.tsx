import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type RatingRow = { date: string; singles?: number | null; doubles?: number | null };

interface RatingHistoryChartProps {
  data: RatingRow[];
}

const formatDateTick = (value: string): string => {
  if (!value) return "";
  // Expecting YYYY-MM-DD; show M/D or short month
  const parts = value.split("-");
  if (parts.length === 3) {
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    if (Number.isFinite(m) && Number.isFinite(d)) return `${m}/${d}`;
  }
  return value;
};

const formatYAxisTick = (val: number): string => {
  if (typeof val !== "number" || !Number.isFinite(val)) return "";
  return val.toFixed(1);
};

interface RechartsTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: Array<{
    dataKey?: string | number;
    value?: number | string | null;
  }>;
}

type PayloadItem = NonNullable<RechartsTooltipProps["payload"]>[number];

const CustomTooltip: React.FC<RechartsTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const singles = payload.find((p: PayloadItem) => String(p.dataKey) === "singles");
    const doubles = payload.find((p: PayloadItem) => String(p.dataKey) === "doubles");
    return (
      <div className="rounded border bg-card p-2 shadow-sm text-card-foreground">
        <div className="text-xs text-muted-foreground">{label}</div>
        {singles && singles.value != null && (
          <div className="text-xs"><span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ backgroundColor: "#1d4ed8" }} />Singles: {Number(singles.value as number).toFixed(3)}</div>
        )}
        {doubles && doubles.value != null && (
          <div className="text-xs"><span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ backgroundColor: "#059669" }} />Doubles: {Number(doubles.value as number).toFixed(3)}</div>
        )}
      </div>
    );
  }
  return null;
};

const RatingHistoryChart: React.FC<RatingHistoryChartProps> = ({ data }) => {
  // Determine Y range with small padding
  const numericValues = data.flatMap((r) => [r.singles ?? null, r.doubles ?? null]).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  const min = numericValues.length ? Math.min(...numericValues) : 0;
  const max = numericValues.length ? Math.max(...numericValues) : 5;
  const pad = (max - min || 1) * 0.1;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tickFormatter={formatDateTick} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
        <YAxis domain={[min - pad, max + pad]} tickFormatter={formatYAxisTick} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="singles" stroke="#1d4ed8" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
        <Line type="monotone" dataKey="doubles" stroke="#059669" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default RatingHistoryChart;

