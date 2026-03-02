import { useEffect } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useSocket } from './useSocket';

export function useChat(roomId?: string) {
  const { rooms, messages, isLoading, fetchRooms, fetchMessages, sendMessage, addMessage } = useChatStore();
  const socketRef = useSocket('/chat');

  useEffect(() => {
    if (!roomId) return;
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('join_chat', roomId);
    fetchMessages(roomId);

    socket.on('new_message', (message: any) => {
      addMessage(message);
    });

    return () => {
      socket.emit('leave_chat', roomId);
      socket.off('new_message');
    };
  }, [roomId, socketRef.current]);

  return { rooms, messages, isLoading, fetchRooms, sendMessage: (content: string) => roomId ? sendMessage(roomId, content) : Promise.resolve() };
}
