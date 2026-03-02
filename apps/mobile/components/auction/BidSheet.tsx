import React, { useState, useCallback, useMemo, forwardRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import PriceDisplay from '../common/PriceDisplay';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';
import { useBid } from '../../hooks/useBid';

interface BidSheetProps {
  auctionId: string;
  currentPrice: number;
  startPrice: number;
  buyNowPrice?: number | null;
  onBidSuccess?: () => void;
}

const BidSheet = forwardRef<BottomSheet, BidSheetProps>(({ auctionId, currentPrice, startPrice, buyNowPrice, onBidSuccess }, ref) => {
  const minBid = currentPrice > 0 ? currentPrice + 1000 : startPrice;
  const [amount, setAmount] = useState(minBid.toString());
  const { submitBid, isSubmitting } = useBid();
  const snapPoints = useMemo(() => ['50%'], []);

  const quickAmounts = [
    minBid,
    Math.ceil((minBid + 10000) / 10000) * 10000,
    Math.ceil((minBid + 30000) / 10000) * 10000,
  ];

  const handleBid = async () => {
    const bidAmount = parseInt(amount);
    if (isNaN(bidAmount) || bidAmount < minBid) {
      Alert.alert('입찰 오류', `최소 ₩${minBid.toLocaleString()} 이상 입찰하세요`);
      return;
    }
    try {
      await submitBid(auctionId, bidAmount);
      onBidSuccess?.();
    } catch {}
  };

  return (
    <BottomSheet ref={ref} index={-1} snapPoints={snapPoints} enablePanDownToClose>
      <BottomSheetView style={styles.content}>
        <Text style={styles.title}>입찰하기</Text>
        <View style={styles.currentPrice}>
          <Text style={styles.label}>현재 최고가</Text>
          <PriceDisplay amount={currentPrice || startPrice} size="large" />
        </View>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder={`최소 ₩${minBid.toLocaleString()}`}
        />
        <View style={styles.quickButtons}>
          {quickAmounts.map(amt => (
            <TouchableOpacity key={amt} style={styles.quickButton} onPress={() => setAmount(amt.toString())}>
              <Text style={styles.quickButtonText}>₩{amt.toLocaleString()}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.escrowNote}>⚠️ 입찰 금액 전액이 에스크로에 보관됩니다</Text>
        <TouchableOpacity style={[styles.bidButton, isSubmitting && styles.disabled]} onPress={handleBid} disabled={isSubmitting}>
          <Text style={styles.bidButtonText}>{isSubmitting ? '처리 중...' : '결제 후 입찰 확정'}</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
});

export default BidSheet;

const styles = StyleSheet.create({
  content: { padding: SPACING.xl },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.lg },
  currentPrice: { marginBottom: SPACING.lg },
  label: { fontSize: FONT_SIZES.small, color: COLORS.textSecondary, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: SPACING.md, fontSize: FONT_SIZES.large, marginBottom: SPACING.md },
  quickButtons: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  quickButton: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  quickButtonText: { fontSize: FONT_SIZES.small, color: COLORS.text, fontWeight: '600' },
  escrowNote: { fontSize: FONT_SIZES.small, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.lg },
  bidButton: { backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  bidButtonText: { color: COLORS.white, fontSize: FONT_SIZES.large, fontWeight: '700' },
  disabled: { opacity: 0.6 },
});
