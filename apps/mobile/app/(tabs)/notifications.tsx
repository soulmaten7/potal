import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Avatar from '../../components/common/Avatar';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../hooks/useNotification';
import { COLORS, FONT_SIZES, SPACING, PROFILE_IMAGE_SIZE } from '../../utils/constants';
import { formatTimeAgo } from '../../utils/format';

export default function NotificationsScreen() {
  const { notifications, fetchNotifications, markAllRead } = useNotification();

  useEffect(() => { fetchNotifications(); }, []);

  const handlePress = (notif: any) => {
    if (notif.relatedAuctionId) router.push(`/auction/${notif.relatedAuctionId}`);
    else if (notif.relatedPostId) router.push(`/post/${notif.relatedPostId}`);
    else if (notif.relatedUserId) router.push(`/user/${notif.relatedUserId}`);
    else if (notif.relatedChatRoomId) router.push(`/chat/${notif.relatedChatRoomId}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>알림</Text>
        <TouchableOpacity onPress={markAllRead}><Text style={styles.readAll}>모두 읽기</Text></TouchableOpacity>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.item, !item.isRead && styles.unread]} onPress={() => handlePress(item)}>
            <Avatar uri={null} size={PROFILE_IMAGE_SIZE.small} />
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>
              <Text style={styles.itemTime}>{formatTimeAgo(item.createdAt)}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<EmptyState icon="notifications-outline" title="알림이 없습니다" />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: '700', color: COLORS.text },
  readAll: { fontSize: FONT_SIZES.medium, color: COLORS.primary, fontWeight: '600' },
  item: { flexDirection: 'row', padding: SPACING.lg, gap: SPACING.md },
  unread: { backgroundColor: '#F0F8FF' },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: FONT_SIZES.medium, fontWeight: '600', color: COLORS.text },
  itemBody: { fontSize: FONT_SIZES.medium, color: COLORS.textSecondary, marginTop: 2 },
  itemTime: { fontSize: FONT_SIZES.small, color: COLORS.textSecondary, marginTop: 4 },
});
