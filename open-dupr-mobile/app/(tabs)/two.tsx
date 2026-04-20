import { StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';

export default function TabTwoScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Try Haptics</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <Pressable
        onPress={() => Haptics.selectionAsync()}
        style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: '#4f46e5' }}
      >
        <Text style={{ color: 'white', fontWeight: '600' }}>Tap for Selection Haptic</Text>
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
