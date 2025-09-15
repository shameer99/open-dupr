import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

export interface RatingPoint {
  date: string;
  // Per-user keyed numeric values for this date
  [userKey: string]: string | number | null;
}

export interface ComparedUser {
  id: number;
  name: string;
  key: string; // unique key for dataKey (e.g., "u_123")
  color: string;
}

interface MultiUserRatingChartProps {
  data: RatingPoint[];
  users: ComparedUser[]; // up to 4
}

const COLORS = ["#1d4ed8", "#059669", "#ef4444", "#a855f7"]; // blue, green, red, purple

const formatDateTick = (value: string): string => {
  if (!value) return "";
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

interface RechartsTooltipPayloadItem {
  dataKey?: string | number;
  value?: number | string | null;
  name?: string;
  color?: string;
}

interface RechartsTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: RechartsTooltipPayloadItem[];
}

const CustomTooltip: React.FC<RechartsTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded border bg-white p-2 shadow-sm">
        <div className="text-xs text-muted-foreground">{label}</div>
        {payload.map((p) => {
          if (p == null || p.value == null || !Number.isFinite(Number(p.value))) return null;
          return (
            <div key={String(p.dataKey)} className="text-xs">
              <span
                className="inline-block w-2 h-2 rounded-sm mr-1"
                style={{ backgroundColor: p.color || "#8884d8" }}
              />
              {p.name}: {Number(p.value as number).toFixed(3)}
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

const MultiUserRatingChart: React.FC<MultiUserRatingChartProps> = ({ data, users }) => {
  const { min, max } = useMemo(() => {
    const values: number[] = [];
    for (const row of data) {
      for (const u of users) {
        const valRaw = row[u.key];
        const val = typeof valRaw === "number" ? valRaw : valRaw != null ? Number(valRaw) : NaN;
        if (Number.isFinite(val)) values.push(val);
      }
    }
    if (!values.length) return { min: 0, max: 5 };
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [data, users]);

  const pad = (max - min || 1) * 0.1;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDateTick}
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          domain={[min - pad, max + pad]}
          tickFormatter={formatYAxisTick}
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend formatter={(value) => String(value)} />
        {users.map((u, idx) => (
          <Line
            key={u.key}
            type="monotone"
            dataKey={u.key}
            name={u.name}
            stroke={u.color || COLORS[idx % COLORS.length]}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default MultiUserRatingChart;

