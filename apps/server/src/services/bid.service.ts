import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler.middleware';
import { v4 as uuidv4 } from 'uuid';

export async function placeBid(auctionId: string, bidderId: string, amount: number, isBuyNow: boolean = false) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const auctionRows = await tx.$queryRaw<any[]>`
      SELECT * FROM "Auction" WHERE id = ${auctionId} FOR UPDATE
    `;
    const auction = auctionRows[0];
    if (!auction) throw new AppError(404, 'AUCTION_NOT_FOUND', '경매를 찾을 수 없습니다');
    if (auction.status !== 'ACTIVE') throw new AppError(400, 'AUCTION_NOT_ACTIVE', '진행 중인 경매가 아닙니다');
    if (new Date() > new Date(auction.endsAt)) throw new AppError(400, 'AUCTION_EXPIRED', '경매가 마감되었습니다');
    if (auction.hostId === bidderId) throw new AppError(400, 'SELF_BID', '자신의 경매에 입찰할 수 없습니다');

    const minBid = auction.currentPrice > 0 ? auction.currentPrice + 1000 : auction.startPrice;
    if (amount < minBid) throw new AppError(400, 'BID_TOO_LOW', `최소 ₩${minBid.toLocaleString()} 이상 입찰해야 합니다`);

    if (isBuyNow) {
      if (!auction.buyNowPrice) throw new AppError(400, 'NO_BUY_NOW', '즉시낙찰가가 설정되지 않은 경매입니다');
      if (amount < auction.buyNowPrice) throw new AppError(400, 'BUY_NOW_TOO_LOW', `즉시낙찰가는 ₩${auction.buyNowPrice.toLocaleString()} 입니다`);
    }

    const previousTopBid = await tx.bid.findFirst({
      where: { auctionId, status: 'ACTIVE' },
      orderBy: { amount: 'desc' },
    });

    if (previousTopBid) {
      await tx.bid.update({ where: { id: previousTopBid.id }, data: { status: 'OUTBID' } });
      if (previousTopBid.paymentId) {
        await tx.payment.update({ where: { id: previousTopBid.paymentId }, data: { status: 'REFUNDED', refundedAt: new Date() } });
      }
      await tx.notification.create({
        data: { userId: previousTopBid.bidderId, type: 'AUCTION_OUTBID', title: '입찰이 밀렸습니다', body: `더 높은 입찰이 들어왔습니다. 현재 최고가: ₩${amount.toLocaleString()}`, relatedAuctionId: auctionId },
      });
    }

    const payment = await tx.payment.create({
      data: { userId: bidderId, amount, type: 'BID_DEPOSIT', status: 'ESCROW_HELD', tossPaymentKey: `mock_${uuidv4()}`, tossOrderId: `order_${uuidv4()}` },
    });

    const bid = await tx.bid.create({
      data: { auctionId, bidderId, amount, status: 'ACTIVE', paymentId: payment.id, isBuyNow },
    });

    await tx.auction.update({
      where: { id: auctionId },
      data: { currentPrice: amount, bidCount: { increment: 1 } },
    });

    await tx.notification.create({
      data: { userId: auction.hostId, type: 'AUCTION_NEW_BID', title: '새로운 입찰이 들어왔습니다', body: `₩${amount.toLocaleString()} 입찰`, relatedAuctionId: auctionId },
    });

    return bid;
  }, { isolationLevel: 'Serializable' });
}
