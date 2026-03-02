import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Avatar from '../common/Avatar';
import { COLORS, FONT_SIZES, SPACING, PROFILE_IMAGE_SIZE } from '../../utils/constants';
import { formatTimeAgo } from '../../utils/format';

interface ChatRoomItemProps {
  room: any;
  currentUserId: string;
  onPress: () => void;
}

export default function ChatRoomItem({ room, currentUserId, onPress }: ChatRoomItemProps) {
  const otherUser = room.user1Id === currentUserId ? room.user2 : room.user1;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Avatar uri={otherUser?.profileImageUrl} size={PROFILE_IMAGE_SIZE.medium} />
      <View style={styles.info}>
        <Text style={styles.username}>{otherUser?.displayName}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {room.lastMessage?.content || room.auction?.title || '채팅을 시작하세요'}
        </Text>
      </View>
      <View style={styles.right}>
        {room.lastMessage && <Text style={styles.time}>{formatTimeAgo(room.lastMessage.createdAt)}</Text>}
        {room.unreadCount > 0 && (
          <View style={styles.badge}><Text style={styles.badgeText}>{room.unreadCount}</Text></View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, gap: SPACING.md },
  info: { flex: 1 },
  username: { fontSize: FONT_SIZES.medium, fontWeight: '600', color: COLORS.text },
  lastMessage: { fontSize: FONT_SIZES.medium, color: COLORS.textSecondary, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  time: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  badge: { backgroundColor: COLORS.like, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', marginTop: 4, paddingHorizontal: 6 },
  badgeText: { color: COLORS.white, fontSize: FONT_SIZES.xs, fontWeight: '700' },
});
