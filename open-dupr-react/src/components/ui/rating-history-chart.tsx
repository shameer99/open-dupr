import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "./chart";
import type { RatingHistoryEntry } from "@/lib/types";

interface RatingHistoryChartProps {
  singlesData: RatingHistoryEntry[];
  doublesData: RatingHistoryEntry[];
  className?: string;
}

const RatingHistoryChart: React.FC<RatingHistoryChartProps> = ({
  singlesData,
  doublesData,
  className,
}) => {
  // Combine and sort data by date
  const combinedData = React.useMemo(() => {
    const dataMap = new Map<string, { date: string; singles?: number; doubles?: number }>();
    
    // Add singles data
    singlesData.forEach((entry) => {
      const existing = dataMap.get(entry.date) || { date: entry.date };
      existing.singles = entry.rating;
      dataMap.set(entry.date, existing);
    });
    
    // Add doubles data
    doublesData.forEach((entry) => {
      const existing = dataMap.get(entry.date) || { date: entry.date };
      existing.doubles = entry.rating;
      dataMap.set(entry.date, existing);
    });
    
    // Convert to array and sort by date
    return Array.from(dataMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [singlesData, doublesData]);

  const chartConfig = {
    singles: {
      label: "Singles",
      color: "hsl(var(--chart-1))",
    },
    doubles: {
      label: "Doubles", 
      color: "hsl(var(--chart-2))",
    },
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatRating = (value: number) => {
    return value.toFixed(3);
  };

  if (combinedData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-48 text-muted-foreground ${className}`}>
        <p>No rating history data available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <LineChart data={combinedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            className="text-xs fill-muted-foreground"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            className="text-xs fill-muted-foreground"
            tick={{ fontSize: 12 }}
            domain={['dataMin - 0.1', 'dataMax + 0.1']}
          />
          <Tooltip 
            content={<ChartTooltipContent />}
            labelFormatter={(value) => formatDate(value)}
            formatter={(value: number, name: string) => [formatRating(value), name]}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="singles" 
            stroke="var(--chart-1)" 
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name="Singles"
          />
          <Line 
            type="monotone" 
            dataKey="doubles" 
            stroke="var(--chart-2)" 
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name="Doubles"
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
};

export default RatingHistoryChart;