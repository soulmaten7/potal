import { Server, Socket } from 'socket.io';
import prisma from '../config/database';

export function setupAuctionSocket(io: Server) {
  const auctionNamespace = io.of('/auction');

  auctionNamespace.on('connection', (socket: Socket) => {
    socket.on('join_auction', (auctionId: string) => {
      socket.join(`auction:${auctionId}`);
    });

    socket.on('leave_auction', (auctionId: string) => {
      socket.leave(`auction:${auctionId}`);
    });
  });

  setInterval(async () => {
    try {
      const activeAuctions = await prisma.auction.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, endsAt: true },
      });

      for (const auction of activeAuctions) {
        const remaining = new Date(auction.endsAt).getTime() - Date.now();
        auctionNamespace.to(`auction:${auction.id}`).emit('auction_timer_sync', {
          auctionId: auction.id,
          remainingMs: Math.max(0, remaining),
          endsAt: auction.endsAt,
        });
      }
    } catch {}
  }, 10000);
}

export function broadcastBidUpdate(io: Server, auctionId: string, bidData: any) {
  io.of('/auction').to(`auction:${auctionId}`).emit('auction_bid_update', bidData);
}

export function broadcastAuctionEnded(io: Server, auctionId: string, data: any) {
  io.of('/auction').to(`auction:${auctionId}`).emit('auction_ended', data);
}
