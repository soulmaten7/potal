import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';

interface RatingDisplayProps {
  averageRating: number;
  totalCount: number;
  punctuality?: number;
  manner?: number;
  conversation?: number;
}

export default function RatingDisplay({ averageRating, totalCount, punctuality, manner, conversation }: RatingDisplayProps) {
  return (
    <View style={styles.container}>
      <View style={styles.overallRow}>
        <Text style={styles.rating}>{averageRating.toFixed(1)}</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map(i => (
            <Ionicons key={i} name={i <= Math.round(averageRating) ? 'star' : 'star-outline'} size={20} color={COLORS.star} />
          ))}
        </View>
        <Text style={styles.count}>({totalCount}개 평가)</Text>
      </View>
      {punctuality !== undefined && (
        <View style={styles.details}>
          <DetailBar label="시간 준수" value={punctuality} />
          <DetailBar label="매너" value={manner || 0} />
          <DetailBar label="대화" value={conversation || 0} />
        </View>
      )}
    </View>
  );
}

function DetailBar({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${(value / 5) * 100}%` }]} />
      </View>
      <Text style={styles.detailValue}>{value.toFixed(1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.lg },
  overallRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rating: { fontSize: 32, fontWeight: '700', color: COLORS.text },
  stars: { flexDirection: 'row', gap: 2 },
  count: { fontSize: FONT_SIZES.small, color: COLORS.textSecondary },
  details: { marginTop: SPACING.lg },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  detailLabel: { width: 60, fontSize: FONT_SIZES.small, color: COLORS.textSecondary },
  bar: { flex: 1, height: 6, backgroundColor: COLORS.border, borderRadius: 3, marginHorizontal: 8 },
  barFill: { height: '100%', backgroundColor: COLORS.star, borderRadius: 3 },
  detailValue: { width: 28, fontSize: FONT_SIZES.small, color: COLORS.text, textAlign: 'right' },
});
