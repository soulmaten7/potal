import cron from 'node-cron';
import { Server } from 'socket.io';
import prisma from '../config/database';
import { endAuction } from '../services/auction.service';
import { broadcastAuctionEnded } from '../socket/auction.socket';

const BATCH_SIZE = 50;

export function startAuctionEndJob(io?: Server) {
  cron.schedule('* * * * *', async () => {
    let cursor: string | undefined;
    let totalProcessed = 0;
    let totalFailed = 0;

    try {
      // Process expired auctions in batches with cursor-based pagination
      while (true) {
        const expiredAuctions = await prisma.auction.findMany({
          where: { status: 'ACTIVE', endsAt: { lte: new Date() } },
          select: { id: true, title: true },
          take: BATCH_SIZE,
          ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
          orderBy: { endsAt: 'asc' },
        });

        if (expiredAuctions.length === 0) break;

        for (const auction of expiredAuctions) {
          try {
            const result = await endAuction(auction.id);
            totalProcessed++;

            // Broadcast auction ended via Socket.IO
            if (io && result) {
              broadcastAuctionEnded(io, auction.id, {
                auctionId: auction.id,
                status: result.status,
                winnerId: result.winnerId,
                winningPrice: result.winningPrice,
              });
            }

            console.log(`Auction ${auction.id} ("${auction.title}") ended successfully`);
          } catch (error) {
            totalFailed++;
            console.error(`Failed to end auction ${auction.id}:`, error);
            // Continue processing other auctions
          }
        }

        cursor = expiredAuctions[expiredAuctions.length - 1].id;

        // If we got fewer than BATCH_SIZE, we've processed all
        if (expiredAuctions.length < BATCH_SIZE) break;
      }

      if (totalProcessed > 0 || totalFailed > 0) {
        console.log(`Auction end job: ${totalProcessed} processed, ${totalFailed} failed`);
      }
    } catch (error) {
      console.error('Auction end job fatal error:', error);
    }
  });
}
