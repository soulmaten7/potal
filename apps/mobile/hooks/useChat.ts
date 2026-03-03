import { useEffect } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useSocket } from './useSocket';

export function useChat(roomId?: string) {
  const { rooms, messages, isLoading, fetchRooms, fetchMessages, sendMessage, addMessage } = useChatStore();
  const { on, off, emit, isConnected } = useSocket('/chat');

  useEffect(() => {
    if (!roomId || !isConnected) return;

    emit('join_chat', roomId);
    fetchMessages(roomId);

    const handleNewMessage = (message: any) => {
      addMessage(message);
    };

    on('new_message', handleNewMessage);

    return () => {
      emit('leave_chat', roomId);
      off('new_message', handleNewMessage);
    };
  }, [roomId, isConnected, on, off, emit]);

  return { rooms, messages, isLoading, fetchRooms, sendMessage: (content: string) => roomId ? sendMessage(roomId, content) : Promise.resolve() };
}
