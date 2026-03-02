import cron from 'node-cron';
import prisma from '../config/database';
import { endAuction } from '../services/auction.service';

export function startAuctionEndJob() {
  cron.schedule('* * * * *', async () => {
    try {
      const expiredAuctions = await prisma.auction.findMany({
        where: { status: 'ACTIVE', endsAt: { lte: new Date() } },
        select: { id: true },
      });

      for (const auction of expiredAuctions) {
        await endAuction(auction.id);
        console.log(`Auction ${auction.id} ended`);
      }
    } catch (error) {
      console.error('Auction end job error:', error);
    }
  });
}
