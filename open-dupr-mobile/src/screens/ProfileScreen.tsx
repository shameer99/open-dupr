import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";
import * as Haptics from "expo-haptics";
import { getMyProfile } from "../lib/api";

type Player = {
  id: number;
  fullName: string;
  imageUrl?: string;
  location?: string;
  stats?: { singles?: string; doubles?: string };
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setError(null);
      const data = await getMyProfile();
      setProfile(data.result);
    } catch (err) {
      setError("Failed to load profile");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

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
      data={[profile]}
      keyExtractor={() => "profile"}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={() => (
        <View style={styles.container}>
          <Text style={styles.title}>{profile?.fullName}</Text>
          {profile?.location ? <Text style={styles.subtitle}>{profile.location}</Text> : null}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ratings</Text>
            <Text style={styles.cardBody}>Singles: {profile?.stats?.singles ?? "-"}</Text>
            <Text style={styles.cardBody}>Doubles: {profile?.stats?.doubles ?? "-"}</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    marginTop: 4,
    color: "#6B7280",
  },
  card: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTitle: {
    fontWeight: "600",
    marginBottom: 8,
    color: "#111827",
  },
  cardBody: {
    color: "#374151",
  },
  error: {
    color: "#DC2626",
  },
  muted: {
    color: "#6B7280",
  },
});

