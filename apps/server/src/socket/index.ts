import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { setupAuctionSocket } from './auction.socket';
import { setupChatSocket } from './chat.socket';

export function setupSocket(httpServer: HTTPServer): Server {
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (token) {
        const payload = verifyAccessToken(token);
        (socket as any).user = payload;
      }
      next();
    } catch {
      next();
    }
  });

  setupAuctionSocket(io);
  setupChatSocket(io);

  return io;
}
