import React, { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { X, Plus, Search } from "lucide-react";
import { searchPlayers, getOtherUserRatingHistory } from "@/lib/api";
import Avatar from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/ui/loading-skeletons";

interface ComparedUser {
  id: number;
  name: string;
  imageUrl?: string;
  color: string;
  data: { date: string; singles?: number | null; doubles?: number | null }[];
}

interface SearchHit {
  id: number;
  fullName: string;
  imageUrl?: string;
  location?: string;
  stats?: { singles?: string; doubles?: string };
}

const USER_COLORS = [
  "#1d4ed8", // blue
  "#059669", // emerald  
  "#dc2626", // red
  "#7c3aed", // violet
];

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

interface CustomTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: Array<{
    dataKey?: string | number;
    value?: number | string | null;
    color?: string;
    name?: string;
  }>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded border bg-white p-2 shadow-sm">
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        {payload.map((entry) => {
          if (entry.value == null) return null;
          return (
            <div key={entry.dataKey} className="text-xs flex items-center gap-1">
              <span 
                className="inline-block w-2 h-2 rounded-sm" 
                style={{ backgroundColor: entry.color }} 
              />
              <span>{entry.name}: {Number(entry.value as number).toFixed(3)}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

interface MultiUserRatingChartProps {
  currentUserId?: number;
  currentUserName?: string;
  currentUserImageUrl?: string;
  currentUserData?: { date: string; singles?: number | null; doubles?: number | null }[];
}

const MultiUserRatingChart: React.FC<MultiUserRatingChartProps> = ({
  currentUserId,
  currentUserName,
  currentUserImageUrl,
  currentUserData = [],
}) => {
  const [comparedUsers, setComparedUsers] = useState<ComparedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState<Set<number>>(new Set());

  // Add current user to comparison if provided
  useEffect(() => {
    if (currentUserId && currentUserName && currentUserData.length > 0) {
      setComparedUsers([{
        id: currentUserId,
        name: currentUserName,
        imageUrl: currentUserImageUrl,
        color: USER_COLORS[0],
        data: currentUserData,
      }]);
    }
  }, [currentUserId, currentUserName, currentUserImageUrl, currentUserData]);

  // Search for players
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await searchPlayers({
          offset: 0,
          limit: 10,
          query: searchQuery,
          filter: {
            lat: 30.2672,
            lng: -97.7431,
            radiusInMeters: 5_000_000,
            rating: { min: 1.0, max: 8.0 },
          },
          includeUnclaimedPlayers: false,
        });
        
        const hits = response?.result?.hits ?? [];
        // Filter out already compared users
        const filteredHits = hits.filter((hit: SearchHit) => 
          !comparedUsers.some(user => user.id === hit.id)
        );
        setSearchResults(filteredHits);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, comparedUsers]);

  const addUser = async (user: SearchHit) => {
    if (comparedUsers.length >= 4) return;
    if (comparedUsers.some(u => u.id === user.id)) return;

    setLoadingUsers(prev => new Set(prev).add(user.id));
    
    try {
      const [singlesResp, doublesResp] = await Promise.all([
        getOtherUserRatingHistory(user.id, "SINGLES"),
        getOtherUserRatingHistory(user.id, "DOUBLES"),
      ]);

      const singlesArr: Array<{ date?: string; rating?: unknown }> =
        singlesResp?.result?.ratingHistory ?? [];
      const doublesArr: Array<{ date?: string; rating?: unknown }> =
        doublesResp?.result?.ratingHistory ?? [];

      const byDate = new Map<string, { date: string; singles?: number | null; doubles?: number | null }>();

      for (const s of singlesArr) {
        const d = s.date || "";
        if (!d) continue;
        const prev = byDate.get(d) || { date: d };
        const val = typeof s.rating === "number" ? s.rating : s.rating != null ? Number(s.rating) : null;
        prev.singles = Number.isFinite(val as number) ? (val as number) : null;
        byDate.set(d, prev);
      }

      for (const dItem of doublesArr) {
        const d = dItem.date || "";
        if (!d) continue;
        const prev = byDate.get(d) || { date: d };
        const val = typeof dItem.rating === "number" ? dItem.rating : dItem.rating != null ? Number(dItem.rating) : null;
        prev.doubles = Number.isFinite(val as number) ? (val as number) : null;
        byDate.set(d, prev);
      }

      const data = Array.from(byDate.values()).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

      const newUser: ComparedUser = {
        id: user.id,
        name: user.fullName,
        imageUrl: user.imageUrl,
        color: USER_COLORS[comparedUsers.length % USER_COLORS.length],
        data,
      };

      setComparedUsers(prev => [...prev, newUser]);
      setSearchQuery("");
      setSearchResults([]);
      setShowSearch(false);
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setLoadingUsers(prev => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
    }
  };

  const removeUser = (userId: number) => {
    setComparedUsers(prev => prev.filter(user => user.id !== userId));
  };

  // Combine all user data for the chart
  const chartData = React.useMemo(() => {
    if (comparedUsers.length === 0) return [];

    const allDates = new Set<string>();
    comparedUsers.forEach(user => {
      user.data.forEach(point => allDates.add(point.date));
    });

    const sortedDates = Array.from(allDates).sort();

    return sortedDates.map(date => {
      const point: Record<string, unknown> = { date };
      
      comparedUsers.forEach(user => {
        const userPoint = user.data.find(d => d.date === date);
        point[`${user.id}_singles`] = userPoint?.singles ?? null;
        point[`${user.id}_doubles`] = userPoint?.doubles ?? null;
      });

      return point;
    });
  }, [comparedUsers]);

  // Calculate Y axis domain
  const yDomain = React.useMemo(() => {
    const allValues: number[] = [];
    comparedUsers.forEach(user => {
      user.data.forEach(point => {
        if (point.singles != null) allValues.push(point.singles);
        if (point.doubles != null) allValues.push(point.doubles);
      });
    });

    if (allValues.length === 0) return [0, 5];

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const pad = (max - min || 1) * 0.1;
    return [min - pad, max + pad];
  }, [comparedUsers]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Rating Comparison</h3>
          {comparedUsers.length < 4 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Player
            </Button>
          )}
        </div>

        {/* User list */}
        <div className="flex flex-wrap gap-2">
          {comparedUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1">
              <Avatar src={user.imageUrl} name={user.name} size="sm" />
              <span className="text-sm font-medium">{user.name}</span>
              <div className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded-sm" 
                  style={{ backgroundColor: user.color }}
                />
                {comparedUsers.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUser(user.id)}
                    className="h-4 w-4 p-0 hover:bg-red-100"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Search interface */}
        {showSearch && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {isSearching && (
              <div className="flex items-center justify-center py-2">
                <LoadingSpinner size="sm" />
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => addUser(result)}
                    disabled={loadingUsers.has(result.id)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 text-left disabled:opacity-50"
                  >
                    <Avatar src={result.imageUrl} name={result.fullName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{result.location}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {result.stats?.singles && <div>S: {result.stats.singles}</div>}
                      {result.stats?.doubles && <div>D: {result.stats.doubles}</div>}
                    </div>
                    {loadingUsers.has(result.id) && <LoadingSpinner size="sm" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {comparedUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No users to compare</p>
            <p className="text-sm">Add players to see their rating comparison</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No rating history available</p>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
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
                  domain={yDomain}
                  tickFormatter={formatYAxisTick} 
                  tick={{ fontSize: 11 }} 
                  axisLine={false} 
                  tickLine={false} 
                  width={32} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                {comparedUsers.map((user) => (
                  <React.Fragment key={user.id}>
                    <Line
                      type="monotone"
                      dataKey={`${user.id}_singles`}
                      name={`${user.name} (Singles)`}
                      stroke={user.color}
                      strokeWidth={2}
                      strokeDasharray="0"
                      dot={false}
                      isAnimationActive={false}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey={`${user.id}_doubles`}
                      name={`${user.name} (Doubles)`}
                      stroke={user.color}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      isAnimationActive={false}
                      connectNulls
                    />
                  </React.Fragment>
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MultiUserRatingChart;