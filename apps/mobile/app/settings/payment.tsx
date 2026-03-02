import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { paymentService } from '../../services/paymentService';
import PriceDisplay from '../../components/common/PriceDisplay';
import EmptyState from '../../components/common/EmptyState';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';
import { formatTimeAgo } from '../../utils/format';

const STATUS_LABELS: Record<string, string> = {
  PENDING: '대기', ESCROW_HELD: '에스크로', RELEASED: '정산완료', REFUNDED: '환불완료', PENALTY_CHARGED: '위약금', FAILED: '실패',
};

export default function PaymentScreen() {
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const { data } = await paymentService.getPayments();
      setPayments(data.data || []);
    } catch {}
  };

  return (
    <FlatList
      style={styles.container}
      data={payments}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <View style={styles.row}>
            <Text style={styles.type}>{item.type}</Text>
            <Text style={[styles.status, item.status === 'REFUNDED' && styles.refunded]}>{STATUS_LABELS[item.status] || item.status}</Text>
          </View>
          <PriceDisplay amount={item.amount} size="medium" />
          <Text style={styles.time}>{formatTimeAgo(item.createdAt)}</Text>
        </View>
      )}
      ListEmptyComponent={<EmptyState icon="card-outline" title="결제 내역이 없습니다" />}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  item: { padding: SPACING.lg, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  type: { fontSize: FONT_SIZES.small, color: COLORS.textSecondary },
  status: { fontSize: FONT_SIZES.small, fontWeight: '600', color: COLORS.primary },
  refunded: { color: COLORS.textSecondary },
  time: { fontSize: FONT_SIZES.small, color: COLORS.textSecondary, marginTop: 4 },
});
