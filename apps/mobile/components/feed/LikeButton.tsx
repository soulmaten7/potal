import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, withDelay } from 'react-native-reanimated';
import { COLORS } from '../../utils/constants';

interface LikeButtonProps {
  isLiked: boolean;
  onPress: () => void;
  size?: number;
}

export default function LikeButton({ isLiked, onPress, size = 24 }: LikeButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(1.3, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <Animated.View style={animatedStyle}>
        <Ionicons
          name={isLiked ? 'heart' : 'heart-outline'}
          size={size}
          color={isLiked ? COLORS.like : COLORS.text}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

export function DoubleTapHeart({ visible }: { visible: boolean }) {
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(400, withTiming(0, { duration: 200 }))
      );
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: opacity.value }],
  }));

  return (
    <Animated.View style={[styles.bigHeart, animatedStyle]} pointerEvents="none">
      <Ionicons name="heart" size={80} color={COLORS.like} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bigHeart: { position: 'absolute', top: '50%', left: '50%', marginTop: -40, marginLeft: -40, zIndex: 10 },
});
