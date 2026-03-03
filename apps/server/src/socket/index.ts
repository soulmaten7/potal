import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { setupAuctionSocket } from './auction.socket';
import { setupChatSocket } from './chat.socket';

/**
 * Socket.IO JWT authentication middleware.
 * Applied to all namespaces that require auth.
 */
function authenticateSocket(socket: Socket, next: (err?: Error) => void) {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('AUTHENTICATION_REQUIRED'));
    }
    const payload = verifyAccessToken(token);
    (socket as any).user = payload;
    next();
  } catch {
    next(new Error('INVALID_TOKEN'));
  }
}

export function setupSocket(httpServer: HTTPServer): Server {
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Default namespace: optional auth (for public data)
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

  // Auction namespace: require JWT auth for bidding, allow read for timer sync
  const auctionNs = io.of('/auction');
  auctionNs.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (token) {
        const payload = verifyAccessToken(token);
        (socket as any).user = payload;
      }
      // Allow connection even without auth (for viewing timers)
      // But bid operations will check socket.user in the handler
      next();
    } catch {
      next();
    }
  });

  // Chat namespace: require JWT auth (only authenticated users can chat)
  const chatNs = io.of('/chat');
  chatNs.use(authenticateSocket);

  setupAuctionSocket(io);
  setupChatSocket(io);

  return io;
}
