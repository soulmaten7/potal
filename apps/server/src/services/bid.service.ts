import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler.middleware';
import { holdEscrow, refundEscrow } from './escrow.service';
import { v4 as uuidv4 } from 'uuid';

const MAX_RETRIES = 3;

export async function placeBid(auctionId: string, bidderId: string, amount: number, isBuyNow: boolean = false) {
  // Retry logic for serialization failures (PostgreSQL error 40001)
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await executeBidTransaction(auctionId, bidderId, amount, isBuyNow);
    } catch (error: any) {
      // Retry on serialization failure
      if (error?.code === 'P2034' || error?.message?.includes('could not serialize')) {
        if (attempt === MAX_RETRIES) throw new AppError(409, 'BID_CONFLICT', '다른 입찰과 충돌이 발생했습니다. 다시 시도해주세요.');
        await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // exponential backoff
        continue;
      }
      throw error;
    }
  }
  throw new AppError(500, 'BID_FAILED', '입찰 처리에 실패했습니다');
}

async function executeBidTransaction(auctionId: string, bidderId: string, amount: number, isBuyNow: boolean) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Lock the auction row with FOR UPDATE to prevent concurrent modifications
    const auctionRows = await tx.$queryRaw<any[]>`
      SELECT * FROM "Auction" WHERE id = ${auctionId} FOR UPDATE
    `;
    const auction = auctionRows[0];
    if (!auction) throw new AppError(404, 'AUCTION_NOT_FOUND', '경매를 찾을 수 없습니다');
    if (auction.status !== 'ACTIVE') throw new AppError(400, 'AUCTION_NOT_ACTIVE', '진행 중인 경매가 아닙니다');
    if (new Date() > new Date(auction.endsAt)) throw new AppError(400, 'AUCTION_EXPIRED', '경매가 마감되었습니다');
    if (auction.hostId === bidderId) throw new AppError(400, 'SELF_BID', '자신의 경매에 입찰할 수 없습니다');

    // 2. Validate bid amount
    const minBid = auction.currentPrice > 0 ? auction.currentPrice + 1000 : auction.startPrice;
    if (amount < minBid) throw new AppError(400, 'BID_TOO_LOW', `최소 ₩${minBid.toLocaleString()} 이상 입찰해야 합니다`);

    if (isBuyNow) {
      if (!auction.buyNowPrice) throw new AppError(400, 'NO_BUY_NOW', '즉시낙찰가가 설정되지 않은 경매입니다');
      if (amount < auction.buyNowPrice) throw new AppError(400, 'BUY_NOW_TOO_LOW', `즉시낙찰가는 ₩${auction.buyNowPrice.toLocaleString()} 입니다`);
    }

    // 3. Handle previous top bidder (outbid + refund)
    const previousTopBid = await tx.bid.findFirst({
      where: { auctionId, status: 'ACTIVE' },
      orderBy: { amount: 'desc' },
    });

    if (previousTopBid) {
      await tx.bid.update({ where: { id: previousTopBid.id }, data: { status: 'OUTBID' } });
      if (previousTopBid.paymentId) {
        // Use escrow service for refund (mock: DB state change)
        await tx.payment.update({ where: { id: previousTopBid.paymentId }, data: { status: 'REFUNDED', refundedAt: new Date() } });
      }
      await tx.notification.create({
        data: { userId: previousTopBid.bidderId, type: 'AUCTION_OUTBID', title: '입찰이 밀렸습니다', body: `더 높은 입찰이 들어왔습니다. 현재 최고가: ₩${amount.toLocaleString()}`, relatedAuctionId: auctionId },
      });
    }

    // 4. Create escrow payment for new bid (mock: DB record with ESCROW_HELD)
    const payment = await tx.payment.create({
      data: {
        userId: bidderId,
        amount,
        type: 'BID_DEPOSIT',
        status: 'ESCROW_HELD',
        auctionId,
        tossPaymentKey: `mock_${uuidv4()}`,
        tossOrderId: `order_${uuidv4()}`,
      },
    });

    // 5. Create bid record
    const bid = await tx.bid.create({
      data: { auctionId, bidderId, amount, status: 'ACTIVE', paymentId: payment.id, isBuyNow },
    });

    // 6. Update auction current price and bid count
    await tx.auction.update({
      where: { id: auctionId },
      data: { currentPrice: amount, bidCount: { increment: 1 } },
    });

    // 7. Notify host
    await tx.notification.create({
      data: { userId: auction.hostId, type: 'AUCTION_NEW_BID', title: '새로운 입찰이 들어왔습니다', body: `₩${amount.toLocaleString()} 입찰`, relatedAuctionId: auctionId },
    });

    return bid;
  }, { isolationLevel: 'Serializable' });
}
