import { StyleSheet, Pressable } from 'react-native';
import React from 'react';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

import { Text, View } from '@/components/Themed';

export default function TabOneScreen() {
  return (
    <View style={styles.container}>
      <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }}>
        <Text style={styles.title}>Tab One</Text>
      </MotiView>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <Pressable
        onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)}
        style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: '#10b981' }}
      >
        <Text style={{ color: 'white', fontWeight: '600' }}>Success Haptic</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
