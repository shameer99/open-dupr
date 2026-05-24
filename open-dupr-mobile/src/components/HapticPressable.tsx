import React from "react";
import { Pressable, PressableProps } from "react-native";
import * as Haptics from "expo-haptics";

type Props = PressableProps & {
  intensity?: Haptics.ImpactFeedbackStyle;
};

export default function HapticPressable({ intensity = Haptics.ImpactFeedbackStyle.Light, onPress, ...rest }: Props) {
  const handlePress = async (e: any) => {
    await Haptics.impactAsync(intensity);
    onPress?.(e);
  };
  return <Pressable onPress={handlePress} {...rest} />;
}

