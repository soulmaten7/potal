import { Server, Socket } from 'socket.io';
import prisma from '../config/database';

// Track auctions in their final minute for high-frequency sync
const urgentAuctionIds = new Set<string>();

export function setupAuctionSocket(io: Server) {
  const auctionNamespace = io.of('/auction');

  auctionNamespace.on('connection', (socket: Socket) => {
    socket.on('join_auction', (auctionId: string) => {
      if (typeof auctionId === 'string' && auctionId.length > 0) {
        socket.join(`auction:${auctionId}`);
      }
    });

    socket.on('leave_auction', (auctionId: string) => {
      if (typeof auctionId === 'string') {
        socket.leave(`auction:${auctionId}`);
      }
    });
  });

  // Normal timer sync: every 10 seconds for all active auctions
  setInterval(async () => {
    try {
      const activeAuctions = await prisma.auction.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, endsAt: true },
      });

      urgentAuctionIds.clear();

      for (const auction of activeAuctions) {
        const remaining = new Date(auction.endsAt).getTime() - Date.now();

        auctionNamespace.to(`auction:${auction.id}`).emit('auction_timer_sync', {
          auctionId: auction.id,
          remainingMs: Math.max(0, remaining),
          endsAt: auction.endsAt,
          serverTime: Date.now(),
        });

        // Track auctions in their final minute for 1s sync
        if (remaining > 0 && remaining <= 60000) {
          urgentAuctionIds.add(auction.id);
        }
      }
    } catch (error) {
      console.error('Timer sync error:', error);
    }
  }, 10000);

  // Urgent timer sync: every 1 second for auctions in final minute
  setInterval(async () => {
    if (urgentAuctionIds.size === 0) return;

    try {
      const urgentIds = Array.from(urgentAuctionIds);
      const auctions = await prisma.auction.findMany({
        where: { id: { in: urgentIds }, status: 'ACTIVE' },
        select: { id: true, endsAt: true },
      });

      for (const auction of auctions) {
        const remaining = new Date(auction.endsAt).getTime() - Date.now();

        if (remaining <= 0) {
          urgentAuctionIds.delete(auction.id);
          continue;
        }

        auctionNamespace.to(`auction:${auction.id}`).emit('auction_timer_sync', {
          auctionId: auction.id,
          remainingMs: Math.max(0, remaining),
          endsAt: auction.endsAt,
          serverTime: Date.now(),
        });
      }
    } catch (error) {
      console.error('Urgent timer sync error:', error);
    }
  }, 1000);
}

export function broadcastBidUpdate(io: Server, auctionId: string, bidData: Record<string, unknown>) {
  io.of('/auction').to(`auction:${auctionId}`).emit('auction_bid_update', bidData);
}

export function broadcastAuctionEnded(io: Server, auctionId: string, data: Record<string, unknown>) {
  io.of('/auction').to(`auction:${auctionId}`).emit('auction_ended', data);
}
