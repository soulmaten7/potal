import React, { useEffect } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import ChatRoomItem from '../../components/chat/ChatRoomItem';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { COLORS } from '../../utils/constants';

export default function ChatListScreen() {
  const { rooms, isLoading, fetchRooms } = useChatStore();
  const { user } = useAuthStore();

  useEffect(() => { fetchRooms(); }, []);

  if (isLoading) return <LoadingSpinner />;

  return (
    <FlatList
      style={styles.container}
      data={rooms}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <ChatRoomItem room={item} currentUserId={user?.id || ''} onPress={() => router.push(`/chat/${item.id}`)} />
      )}
      ListEmptyComponent={<EmptyState icon="chatbubbles-outline" title="채팅이 없습니다" message="경매 낙찰 시 채팅이 생성됩니다" />}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
});
