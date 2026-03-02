import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { useChat } from '../../hooks/useChat';
import { useAuthStore } from '../../stores/authStore';
import { COLORS } from '../../utils/constants';

export default function ChatScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { messages, sendMessage } = useChat(roomId);
  const { user } = useAuthStore();

  const giftedMessages: IMessage[] = messages.map((m: any) => ({
    _id: m.id,
    text: m.content,
    createdAt: new Date(m.createdAt),
    user: { _id: m.senderId, name: m.sender?.displayName, avatar: m.sender?.profileImageUrl },
  })).reverse();

  const onSend = useCallback((msgs: IMessage[] = []) => {
    if (msgs[0]?.text) sendMessage(msgs[0].text);
  }, [sendMessage]);

  return (
    <View style={styles.container}>
      <GiftedChat
        messages={giftedMessages}
        onSend={onSend}
        user={{ _id: user?.id || '', name: user?.displayName }}
        placeholder="메시지 입력..."
        locale="ko"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
});
