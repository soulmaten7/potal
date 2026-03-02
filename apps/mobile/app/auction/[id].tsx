import React, { useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import BottomSheet from '@gorhom/bottom-sheet';
import Avatar from '../../components/common/Avatar';
import VerificationBadge from '../../components/profile/VerificationBadge';
import ImageCarousel from '../../components/feed/ImageCarousel';
import AuctionTimer from '../../components/auction/AuctionTimer';
import BidSheet from '../../components/auction/BidSheet';
import PriceDisplay from '../../components/common/PriceDisplay';
import LikeButton from '../../components/feed/LikeButton';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuction } from '../../hooks/useAuction';
import { COLORS, FONT_SIZES, SPACING, PROFILE_IMAGE_SIZE } from '../../utils/constants';

export default function AuctionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { auction, isLoading, refresh } = useAuction(id);
  const bidSheetRef = useRef<BottomSheet>(null);

  if (isLoading || !auction) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <ScrollView>
        <TouchableOpacity style={styles.hostInfo} onPress={() => router.push(`/user/${auction.host?.username}`)}>
          <Avatar uri={auction.host?.profileImageUrl} size={PROFILE_IMAGE_SIZE.medium} />
          <View style={styles.hostDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.hostName}>{auction.host?.displayName}</Text>
              {auction.host?.verificationBadge && <VerificationBadge size={16} />}
            </View>
            <Text style={styles.hostSub}>⭐ {auction.host?.averageRating?.toFixed(1) || '0.0'} · 팔로워 {auction.host?.followerCount || 0}</Text>
          </View>
        </TouchableOpacity>
        <ImageCarousel images={auction.images || []} />
        <View style={styles.content}>
          <View style={styles.likeRow}>
            <LikeButton isLiked={auction.isLiked} onPress={() => {}} />
            <Text style={styles.likeCount}>좋아요 {auction.likeCount}개</Text>
          </View>
          <Text style={styles.title}>{auction.title}</Text>
          {auction.description && <Text style={styles.description}>{auction.description}</Text>}
          <View style={styles.timerRow}>
            <Text style={styles.label}>남은 시간</Text>
            <AuctionTimer endsAt={auction.endsAt} size="large" />
          </View>
          <View style={styles.infoBox}>
            <InfoRow label="현재가" value={<PriceDisplay amount={auction.currentPrice || auction.startPrice} size="large" />} />
            <InfoRow label="시작가" value={<PriceDisplay amount={auction.startPrice} size="small" />} />
            {auction.buyNowPrice && <InfoRow label="즉시낙찰가" value={<PriceDisplay amount={auction.buyNowPrice} size="small" />} />}
            <InfoRow label="입찰 수" value={<Text style={styles.infoValue}>{auction.bidCount}건</Text>} />
          </View>
          {auction.bids && auction.bids.length > 0 && (
            <View style={styles.bidsSection}>
              <Text style={styles.sectionTitle}>입찰 내역 (상위 3건)</Text>
              {auction.bids.map((bid: any, i: number) => (
                <View key={bid.id} style={styles.bidRow}>
                  <Text style={styles.bidRank}>{i + 1}위</Text>
                  <PriceDisplay amount={bid.amount} size="medium" />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.bidButton} onPress={() => bidSheetRef.current?.snapToIndex(0)}>
          <Text style={styles.bidButtonText}>입찰하기</Text>
        </TouchableOpacity>
        {auction.buyNowPrice && (
          <TouchableOpacity style={styles.buyNowButton} onPress={() => bidSheetRef.current?.snapToIndex(0)}>
            <Text style={styles.buyNowText}>즉시낙찰</Text>
          </TouchableOpacity>
        )}
      </View>
      <BidSheet ref={bidSheetRef} auctionId={id} currentPrice={auction.currentPrice} startPrice={auction.startPrice} buyNowPrice={auction.buyNowPrice} onBidSuccess={refresh} />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      {value}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  hostInfo: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, gap: SPACING.md },
  hostDetails: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hostName: { fontSize: FONT_SIZES.large, fontWeight: '600', color: COLORS.text },
  hostSub: { fontSize: FONT_SIZES.small, color: COLORS.textSecondary, marginTop: 2 },
  content: { padding: SPACING.lg },
  likeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.md },
  likeCount: { fontSize: FONT_SIZES.medium, fontWeight: '600', color: COLORS.text },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.text },
  description: { fontSize: FONT_SIZES.medium, color: COLORS.text, marginTop: SPACING.sm, lineHeight: 22 },
  timerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.lg, padding: SPACING.md, backgroundColor: COLORS.auctionBg, borderRadius: 12 },
  label: { fontSize: FONT_SIZES.medium, color: COLORS.textSecondary },
  infoBox: { marginTop: SPACING.lg, padding: SPACING.md, backgroundColor: '#F9F9F9', borderRadius: 12, gap: SPACING.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: FONT_SIZES.medium, color: COLORS.textSecondary },
  infoValue: { fontSize: FONT_SIZES.medium, fontWeight: '600', color: COLORS.text },
  bidsSection: { marginTop: SPACING.lg },
  sectionTitle: { fontSize: FONT_SIZES.large, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.md },
  bidRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm },
  bidRank: { fontSize: FONT_SIZES.medium, fontWeight: '700', color: COLORS.primary, width: 30 },
  footer: { flexDirection: 'row', padding: SPACING.lg, gap: SPACING.md, borderTopWidth: 0.5, borderTopColor: COLORS.border },
  bidButton: { flex: 2, backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  bidButtonText: { color: COLORS.white, fontSize: FONT_SIZES.large, fontWeight: '700' },
  buyNowButton: { flex: 1, backgroundColor: COLORS.text, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  buyNowText: { color: COLORS.white, fontSize: FONT_SIZES.medium, fontWeight: '700' },
});
