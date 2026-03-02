import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../common/Avatar';
import VerificationBadge from '../profile/VerificationBadge';
import ImageCarousel from './ImageCarousel';
import LikeButton from './LikeButton';
import PriceDisplay from '../common/PriceDisplay';
import { COLORS, FONT_SIZES, SPACING, PROFILE_IMAGE_SIZE } from '../../utils/constants';
import { formatTimer, formatTimeAgo } from '../../utils/format';
import { auctionService } from '../../services/auctionService';

interface AuctionCardProps {
  auction: any;
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  const [isLiked, setIsLiked] = useState(auction.isLiked || false);
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = new Date(auction.endsAt).getTime() - Date.now();
      setRemainingMs(Math.max(0, remaining));
    }, 1000);
    return () => clearInterval(timer);
  }, [auction.endsAt]);

  const handleLike = async () => {
    try {
      if (isLiked) await auctionService.unlikeAuction(auction.id);
      else await auctionService.likeAuction(auction.id);
      setIsLiked(!isLiked);
    } catch {}
  };

  const isUrgent = remainingMs < 60000 && remainingMs > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerLeft} onPress={() => router.push(`/user/${auction.host?.username}`)}>
          <Avatar uri={auction.host?.profileImageUrl} size={PROFILE_IMAGE_SIZE.small} />
          <Text style={styles.username}>{auction.host?.username}</Text>
          {auction.host?.verificationBadge && <VerificationBadge />}
          {auction.host?.averageRating > 0 && <Text style={styles.rating}>⭐ {auction.host.averageRating.toFixed(1)}</Text>}
        </TouchableOpacity>
      </View>
      <View style={styles.imageWrapper}>
        <ImageCarousel images={auction.images || []} />
        <View style={styles.liveBadge}>
          <Text style={styles.liveBadgeText}>🔴 LIVE 경매</Text>
        </View>
        <View style={styles.timerOverlay}>
          <Text style={[styles.timerText, isUrgent && styles.urgentTimer]}>{formatTimer(remainingMs)}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <LikeButton isLiked={isLiked} onPress={handleLike} />
      </View>
      <View style={styles.auctionInfo}>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>현재가</Text>
          <PriceDisplay amount={auction.currentPrice || auction.startPrice} size="large" />
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detail}>입찰 {auction.bidCount}건</Text>
          <Text style={styles.detail}>시작가 ₩{(auction.startPrice || 0).toLocaleString()}</Text>
          {auction.buyNowPrice && <Text style={styles.detail}>즉시낙찰 ₩{auction.buyNowPrice.toLocaleString()}</Text>}
        </View>
        <TouchableOpacity style={styles.bidButton} onPress={() => router.push(`/auction/${auction.id}`)}>
          <Text style={styles.bidButtonText}>💰 입찰하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  username: { fontSize: FONT_SIZES.medium, fontWeight: '600', color: COLORS.text },
  rating: { fontSize: FONT_SIZES.small, color: COLORS.textSecondary },
  imageWrapper: { position: 'relative' },
  liveBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  liveBadgeText: { color: COLORS.white, fontSize: FONT_SIZES.small, fontWeight: '700' },
  timerOverlay: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6 },
  timerText: { color: COLORS.white, fontSize: FONT_SIZES.large, fontWeight: '700', fontVariant: ['tabular-nums'] },
  urgentTimer: { color: COLORS.auctionLive },
  actions: { flexDirection: 'row', padding: SPACING.md, gap: SPACING.lg },
  auctionInfo: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.lg, backgroundColor: COLORS.auctionBg, marginHorizontal: SPACING.md, borderRadius: 12, padding: SPACING.md },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceLabel: { fontSize: FONT_SIZES.small, color: COLORS.textSecondary },
  detailRow: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  detail: { fontSize: FONT_SIZES.small, color: COLORS.textSecondary },
  bidButton: { marginTop: SPACING.md, backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  bidButtonText: { color: COLORS.white, fontSize: FONT_SIZES.medium, fontWeight: '700' },
});
