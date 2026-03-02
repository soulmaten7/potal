import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';

interface EmptyStateProps {
  icon: string;
  title: string;
  message?: string;
}

export default function EmptyState({ icon, title, message }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon as any} size={64} color={COLORS.border} />
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  title: { fontSize: FONT_SIZES.large, fontWeight: '600', color: COLORS.text, marginTop: SPACING.lg },
  message: { fontSize: FONT_SIZES.medium, color: COLORS.textSecondary, marginTop: SPACING.sm, textAlign: 'center' },
});
