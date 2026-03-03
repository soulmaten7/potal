import { Server, Socket } from 'socket.io';

export function setupChatSocket(io: Server) {
  const chatNamespace = io.of('/chat');

  // Auth middleware is applied in socket/index.ts
  chatNamespace.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    if (!user) {
      socket.disconnect(true);
      return;
    }

    socket.on('join_chat', (roomId: string) => {
      if (typeof roomId === 'string' && roomId.length > 0) {
        socket.join(`chat:${roomId}`);
      }
    });

    socket.on('leave_chat', (roomId: string) => {
      if (typeof roomId === 'string') {
        socket.leave(`chat:${roomId}`);
      }
    });

    socket.on('send_message', (data: { roomId: string; message: Record<string, unknown> }) => {
      if (!data?.roomId || !data?.message) return;
      // Broadcast to room including sender (for confirmation)
      chatNamespace.to(`chat:${data.roomId}`).emit('new_message', {
        ...data.message,
        senderId: user.userId,
      });
    });

    socket.on('typing', (data: { roomId: string }) => {
      if (!data?.roomId) return;
      socket.to(`chat:${data.roomId}`).emit('typing', { userId: user.userId });
    });

    socket.on('stop_typing', (data: { roomId: string }) => {
      if (!data?.roomId) return;
      socket.to(`chat:${data.roomId}`).emit('stop_typing', { userId: user.userId });
    });
  });
}
