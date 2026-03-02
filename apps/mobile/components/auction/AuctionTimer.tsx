import React, { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { COLORS, FONT_SIZES } from '../../utils/constants';
import { formatTimer } from '../../utils/format';

interface AuctionTimerProps {
  endsAt: string;
  size?: 'small' | 'large';
}

export default function AuctionTimer({ endsAt, size = 'small' }: AuctionTimerProps) {
  const [remainingMs, setRemainingMs] = useState(0);
  const opacity = useSharedValue(1);
  const isUrgent = remainingMs < 60000 && remainingMs > 0;

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingMs(Math.max(0, new Date(endsAt).getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  useEffect(() => {
    if (isUrgent) {
      opacity.value = withRepeat(withTiming(0.3, { duration: 500 }), -1, true);
    } else {
      opacity.value = 1;
    }
  }, [isUrgent]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: isUrgent ? opacity.value : 1 }));

  return (
    <Animated.View style={animatedStyle}>
      <Text style={[styles.timer, size === 'large' && styles.large, isUrgent && styles.urgent]}>
        {formatTimer(remainingMs)}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  timer: { fontSize: FONT_SIZES.large, fontWeight: '700', color: COLORS.text, fontVariant: ['tabular-nums'] },
  large: { fontSize: FONT_SIZES.xxl },
  urgent: { color: COLORS.auctionLive },
});
