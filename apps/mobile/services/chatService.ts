import api from './api';

export const chatService = {
  getRooms: () => api.get('/chat/rooms'),
  getMessages: (roomId: string, cursor?: string) =>
    api.get(`/chat/rooms/${roomId}/messages`, { params: { cursor } }),
  sendMessage: (roomId: string, content: string, imageUrl?: string) =>
    api.post(`/chat/rooms/${roomId}/messages`, { content, imageUrl }),
};
