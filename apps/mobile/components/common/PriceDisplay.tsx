import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { COLORS, FONT_SIZES } from '../../utils/constants';

interface PriceDisplayProps {
  amount: number;
  size?: 'small' | 'medium' | 'large';
  style?: TextStyle;
}

export default function PriceDisplay({ amount, size = 'medium', style }: PriceDisplayProps) {
  const fontSize = size === 'large' ? FONT_SIZES.xxl : size === 'small' ? FONT_SIZES.medium : FONT_SIZES.large;
  return (
    <Text style={[styles.price, { fontSize }, style]}>
      ₩{amount.toLocaleString('ko-KR')}
    </Text>
  );
}

const styles = StyleSheet.create({
  price: {
    fontWeight: '700',
    color: COLORS.text,
  },
});
