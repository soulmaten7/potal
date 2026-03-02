import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Avatar from '../common/Avatar';
import StarRating from './StarRating';
import { COLORS, FONT_SIZES, SPACING, PROFILE_IMAGE_SIZE } from '../../utils/constants';
import { formatTimeAgo } from '../../utils/format';

interface ReviewCardProps {
  review: any;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar uri={review.author?.profileImageUrl} size={PROFILE_IMAGE_SIZE.small} />
        <View style={styles.headerInfo}>
          <Text style={styles.username}>{review.author?.username}</Text>
          <StarRating rating={review.rating} size={14} readonly />
        </View>
        <Text style={styles.time}>{formatTimeAgo(review.createdAt)}</Text>
      </View>
      {review.content && <Text style={styles.content}>{review.content}</Text>}
      {review.auction && <Text style={styles.auctionTitle}>📍 {review.auction.title}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerInfo: { flex: 1 },
  username: { fontSize: FONT_SIZES.medium, fontWeight: '600', color: COLORS.text },
  time: { fontSize: FONT_SIZES.small, color: COLORS.textSecondary },
  content: { fontSize: FONT_SIZES.medium, color: COLORS.text, marginTop: SPACING.sm },
  auctionTitle: { fontSize: FONT_SIZES.small, color: COLORS.textSecondary, marginTop: SPACING.xs },
});
