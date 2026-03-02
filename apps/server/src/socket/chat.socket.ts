import { Server, Socket } from 'socket.io';

export function setupChatSocket(io: Server) {
  const chatNamespace = io.of('/chat');

  chatNamespace.on('connection', (socket: Socket) => {
    socket.on('join_chat', (roomId: string) => {
      socket.join(`chat:${roomId}`);
    });

    socket.on('leave_chat', (roomId: string) => {
      socket.leave(`chat:${roomId}`);
    });

    socket.on('send_message', (data: { roomId: string; message: any }) => {
      chatNamespace.to(`chat:${data.roomId}`).emit('new_message', data.message);
    });

    socket.on('typing', (data: { roomId: string; userId: string }) => {
      socket.to(`chat:${data.roomId}`).emit('typing', { userId: data.userId });
    });
  });
}
