import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getOtherUserRatingHistory } from "@/lib/api";
import { ChartContainer } from "@/components/ui/chart";

interface RatingHistoryPoint {
  ratingHistoryId: number;
  userId: number;
  userName: string;
  singles: number;
  singlesProvisional: boolean;
  doubles: number;
  doublesProvisional: boolean;
  matchDate: string;
  created: string;
  status: string;
}

interface RatingHistoryChartProps {
  playerId: number;
}

interface ChartDataPoint {
  date: string;
  singles: number;
  doubles: number;
  singlesProvisional?: boolean;
  doublesProvisional?: boolean;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { 
    month: "short", 
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined 
  });
};

interface TooltipPayload {
  color: string;
  dataKey: string;
  value: number;
  payload: ChartDataPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-2">{formatDate(label || "")}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.dataKey === "singles" ? "Singles" : "Doubles"}: {entry.value.toFixed(3)}
            {entry.payload[`${entry.dataKey}Provisional` as keyof ChartDataPoint] && (
              <span className="text-xs text-muted-foreground ml-1">(Provisional)</span>
            )}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface LegendPayload {
  color: string;
  dataKey: string;
}

interface CustomLegendProps {
  payload?: LegendPayload[];
}

const CustomLegend: React.FC<CustomLegendProps> = ({ payload }) => {
  if (!payload) return null;
  
  return (
    <div className="flex items-center justify-center gap-6 mt-4">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-0.5 rounded"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-muted-foreground">
            {entry.dataKey === "singles" ? "Singles" : "Doubles"}
          </span>
        </div>
      ))}
    </div>
  );
};

const RatingHistoryChart: React.FC<RatingHistoryChartProps> = ({ playerId }) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRatingHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch both singles and doubles history
        const [singlesResponse, doublesResponse] = await Promise.all([
          getOtherUserRatingHistory(playerId, "SINGLES"),
          getOtherUserRatingHistory(playerId, "DOUBLES")
        ]);

        const singlesHistory: RatingHistoryPoint[] = singlesResponse.result?.hits || [];
        const doublesHistory: RatingHistoryPoint[] = doublesResponse.result?.hits || [];

        // Create a map to combine ratings by date
        const ratingMap = new Map<string, ChartDataPoint>();

        // Process singles history
        singlesHistory.forEach((point) => {
          const existing = ratingMap.get(point.matchDate) || {
            date: point.matchDate,
            singles: 0,
            doubles: 0,
            singlesProvisional: false,
            doublesProvisional: false,
          };
          existing.singles = point.singles;
          existing.singlesProvisional = point.singlesProvisional;
          ratingMap.set(point.matchDate, existing);
        });

        // Process doubles history
        doublesHistory.forEach((point) => {
          const existing = ratingMap.get(point.matchDate) || {
            date: point.matchDate,
            singles: 0,
            doubles: 0,
            singlesProvisional: false,
            doublesProvisional: false,
          };
          existing.doubles = point.doubles;
          existing.doublesProvisional = point.doublesProvisional;
          ratingMap.set(point.matchDate, existing);
        });

        // Convert to array and sort by date
        const combinedData = Array.from(ratingMap.values())
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .filter(point => point.singles > 0 || point.doubles > 0); // Only include points with actual ratings

        setChartData(combinedData);
      } catch (err) {
        console.error("Failed to fetch rating history:", err);
        setError(err instanceof Error ? err.message : "Failed to load rating history");
      } finally {
        setLoading(false);
      }
    };

    fetchRatingHistory();
  }, [playerId]);

  if (loading) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading rating history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <div className="text-sm text-red-500">Failed to load rating history</div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <div className="text-sm text-muted-foreground">No rating history available</div>
      </div>
    );
  }

  return (
    <ChartContainer className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            className="text-xs fill-muted-foreground"
            angle={-45}
            textAnchor="end"
            height={60}
            interval="preserveStartEnd"
          />
          <YAxis
            className="text-xs fill-muted-foreground"
            domain={['dataMin - 0.1', 'dataMax + 0.1']}
            tickFormatter={(value) => value.toFixed(1)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          <Line
            type="monotone"
            dataKey="singles"
            stroke="hsl(var(--chart-1, 220 70% 50%))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--chart-1, 220 70% 50%))", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="doubles"
            stroke="hsl(var(--chart-2, 160 60% 45%))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--chart-2, 160 60% 45%))", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default RatingHistoryChart;