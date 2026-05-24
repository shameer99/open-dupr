import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, RefreshControl, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { getFeed, getMyProfile } from "../lib/api";

type FeedTeam = {
  id: number;
  game1: number;
  game2: number;
  game3: number;
  game4: number;
  game5: number;
  winner: boolean;
  teamPlayer1?: { id: number; fullName: string; imageUrl?: string | null } | null;
  teamPlayer2?: { id: number; fullName: string; imageUrl?: string | null } | null;
};

type FeedMatch = {
  id: number;
  venue?: string | null;
  location?: string;
  tournament?: string | null;
  eventDate: string;
  eventFormat: string;
  confirmed?: boolean;
  teams: FeedTeam[];
};

type PostResponse = { matches: FeedMatch[] };

export default function FeedScreen() {
  const [matches, setMatches] = useState<FeedMatch[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    try {
      setError(null);
      const profile = await getMyProfile();
      const userId = profile?.result?.id;
      const feed = await getFeed(userId);
      const posts: PostResponse[] = feed?.results || [];
      const matchPosts = posts.flatMap((p) => p.matches);
      setMatches(matchPosts);
    } catch (err) {
      setError("Failed to load feed");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  }, [loadFeed]);

  const renderItem = useCallback(({ item }: { item: FeedMatch }) => {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{item.eventFormat}</Text>
        {item.location ? <Text style={styles.muted}>{item.location}</Text> : null}
        <Text style={styles.body}>{new Date(item.eventDate).toDateString()}</Text>
        <View style={styles.row}>
          {item.teams.map((t) => (
            <View key={t.id} style={[styles.team, t.winner && styles.winner]}> 
              <Text style={styles.body}>{t.teamPlayer1?.fullName ?? "Unknown"}</Text>
              {t.teamPlayer2 ? <Text style={styles.body}>/ {t.teamPlayer2.fullName}</Text> : null}
            </View>
          ))}
        </View>
      </View>
    );
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={{ padding: 16 }}
      data={matches}
      keyExtractor={(m) => String(m.id)}
      renderItem={renderItem}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: "#6B7280" },
  error: { color: "#DC2626" },
  card: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 6 },
  body: { color: "#374151" },
  row: { flexDirection: "row", gap: 8, marginTop: 8 },
  team: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: "#F3F4F6" },
  winner: { backgroundColor: "#D1FAE5" },
});

