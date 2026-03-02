import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Avatar from '../common/Avatar';
import VerificationBadge from '../profile/VerificationBadge';
import ImageCarousel from './ImageCarousel';
import LikeButton, { DoubleTapHeart } from './LikeButton';
import { COLORS, FONT_SIZES, SPACING, PROFILE_IMAGE_SIZE } from '../../utils/constants';
import { formatTimeAgo } from '../../utils/format';
import { postService } from '../../services/postService';

interface PostCardProps {
  post: any;
}

export default function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [showHeart, setShowHeart] = useState(false);

  const handleLike = async () => {
    try {
      if (isLiked) {
        await postService.unlikePost(post.id);
        setLikeCount((c: number) => c - 1);
      } else {
        await postService.likePost(post.id);
        setLikeCount((c: number) => c + 1);
      }
      setIsLiked(!isLiked);
    } catch {}
  };

  const handleDoubleTap = () => {
    if (!isLiked) handleLike();
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerLeft} onPress={() => router.push(`/user/${post.author?.username}`)}>
          <Avatar uri={post.author?.profileImageUrl} size={PROFILE_IMAGE_SIZE.small} />
          <Text style={styles.username}>{post.author?.username}</Text>
          {post.author?.verificationBadge && <VerificationBadge />}
        </TouchableOpacity>
      </View>
      <View style={styles.imageWrapper}>
        <ImageCarousel images={post.images || []} onDoubleTap={handleDoubleTap} />
        <DoubleTapHeart visible={showHeart} />
      </View>
      <View style={styles.actions}>
        <LikeButton isLiked={isLiked} onPress={handleLike} />
      </View>
      <View style={styles.footer}>
        <Text style={styles.likeCount}>좋아요 {likeCount}개</Text>
        {post.caption && (
          <Text style={styles.caption}>
            <Text style={styles.captionUsername}>{post.author?.username} </Text>
            {post.caption}
          </Text>
        )}
        <Text style={styles.time}>{formatTimeAgo(post.createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  username: { fontSize: FONT_SIZES.medium, fontWeight: '600', color: COLORS.text },
  imageWrapper: { position: 'relative' },
  actions: { flexDirection: 'row', padding: SPACING.md, gap: SPACING.lg },
  footer: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.md },
  likeCount: { fontSize: FONT_SIZES.medium, fontWeight: '600', color: COLORS.text },
  caption: { fontSize: FONT_SIZES.medium, color: COLORS.text, marginTop: 4 },
  captionUsername: { fontWeight: '600' },
  time: { fontSize: FONT_SIZES.small, color: COLORS.textSecondary, marginTop: 4 },
});
