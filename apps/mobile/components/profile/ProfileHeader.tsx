import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Avatar from '../common/Avatar';
import VerificationBadge from './VerificationBadge';
import { COLORS, FONT_SIZES, SPACING, PROFILE_IMAGE_SIZE } from '../../utils/constants';
import { formatCount } from '../../utils/format';

interface ProfileHeaderProps {
  user: any;
  isOwnProfile?: boolean;
  isFollowing?: boolean;
  onEditProfile?: () => void;
  onFollow?: () => void;
  onFollowers?: () => void;
  onFollowing?: () => void;
}

export default function ProfileHeader({ user, isOwnProfile, isFollowing, onEditProfile, onFollow, onFollowers, onFollowing }: ProfileHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Avatar uri={user?.profileImageUrl} size={PROFILE_IMAGE_SIZE.large} />
        <View style={styles.stats}>
          <StatItem count={user?.postCount || 0} label="게시물" />
          <StatItem count={user?.followerCount || 0} label="팔로워" onPress={onFollowers} />
          <StatItem count={user?.followingCount || 0} label="팔로잉" onPress={onFollowing} />
        </View>
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.displayName}>{user?.displayName}</Text>
          {user?.verificationBadge && <VerificationBadge size={16} />}
          {user?.averageRating > 0 && <Text style={styles.rating}>⭐ {user.averageRating.toFixed(1)}</Text>}
        </View>
        {user?.bio && <Text style={styles.bio}>{user.bio}</Text>}
        {user?.websiteUrl && <Text style={styles.website}>{user.websiteUrl}</Text>}
      </View>
      {isOwnProfile ? (
        <TouchableOpacity style={styles.editButton} onPress={onEditProfile}>
          <Text style={styles.editButtonText}>프로필 편집</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[styles.followButton, isFollowing && styles.followingButton]} onPress={onFollow}>
          <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
            {isFollowing ? '팔로잉' : '팔로우'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function StatItem({ count, label, onPress }: { count: number; label: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.statItem} onPress={onPress} disabled={!onPress}>
      <Text style={styles.statCount}>{formatCount(count)}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.lg, backgroundColor: COLORS.background },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  stats: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', marginLeft: SPACING.xl },
  statItem: { alignItems: 'center' },
  statCount: { fontSize: FONT_SIZES.large, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: FONT_SIZES.small, color: COLORS.text, marginTop: 2 },
  info: { marginTop: SPACING.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  displayName: { fontSize: FONT_SIZES.medium, fontWeight: '600', color: COLORS.text },
  rating: { fontSize: FONT_SIZES.small, color: COLORS.textSecondary, marginLeft: 4 },
  bio: { fontSize: FONT_SIZES.medium, color: COLORS.text, marginTop: 2 },
  website: { fontSize: FONT_SIZES.medium, color: COLORS.primary, marginTop: 2 },
  editButton: { marginTop: SPACING.md, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  editButtonText: { fontSize: FONT_SIZES.medium, fontWeight: '600', color: COLORS.text },
  followButton: { marginTop: SPACING.md, backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  followingButton: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  followButtonText: { fontSize: FONT_SIZES.medium, fontWeight: '600', color: COLORS.white },
  followingButtonText: { color: COLORS.text },
});
