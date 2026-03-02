import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler.middleware';

const AUCTION_DURATION_MAP: Record<string, number> = {
  HOURS_24: 24 * 60 * 60 * 1000,
  HOURS_48: 48 * 60 * 60 * 1000,
  HOURS_72: 72 * 60 * 60 * 1000,
};

export async function createAuction(hostId: string, data: {
  title: string; description?: string; auctionDuration: string; mealDuration: string;
  startPrice: number; buyNowPrice?: number; city: string;
}, imageUrls: string[]) {
  if (data.buyNowPrice && data.buyNowPrice <= data.startPrice) {
    throw new AppError(400, 'INVALID_BUY_NOW', '즉시낙찰가는 시작가보다 높아야 합니다');
  }

  const startsAt = new Date();
  const durationMs = AUCTION_DURATION_MAP[data.auctionDuration] || AUCTION_DURATION_MAP.HOURS_24;
  const endsAt = new Date(startsAt.getTime() + durationMs);

  const auction = await prisma.auction.create({
    data: {
      hostId,
      title: data.title,
      description: data.description,
      auctionDuration: data.auctionDuration as any,
      mealDuration: data.mealDuration as any,
      startPrice: data.startPrice,
      buyNowPrice: data.buyNowPrice,
      currentPrice: 0,
      startsAt,
      endsAt,
      city: data.city,
      status: 'ACTIVE',
      images: { create: imageUrls.map((url, i) => ({ imageUrl: url, order: i })) },
    },
    include: { images: true, host: { select: { id: true, username: true, displayName: true, profileImageUrl: true, verificationBadge: true, averageRating: true } } },
  });

  await prisma.user.update({ where: { id: hostId }, data: { auctionCount: { increment: 1 } } });
  return auction;
}

export async function getAuctionById(auctionId: string, currentUserId?: string) {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      images: { orderBy: { order: 'asc' } },
      host: { select: { id: true, username: true, displayName: true, profileImageUrl: true, verificationBadge: true, averageRating: true, totalRatingCount: true, followerCount: true, tier: true } },
      bids: { orderBy: { amount: 'desc' }, take: 3, select: { id: true, amount: true, createdAt: true } },
    },
  });
  if (!auction) throw new AppError(404, 'AUCTION_NOT_FOUND', '경매를 찾을 수 없습니다');

  await prisma.auction.update({ where: { id: auctionId }, data: { viewCount: { increment: 1 } } });

  let isLiked = false;
  let myBid = null;
  if (currentUserId) {
    const like = await prisma.like.findFirst({ where: { userId: currentUserId, targetType: 'AUCTION', auctionId } });
    isLiked = !!like;
    const bid = await prisma.bid.findFirst({ where: { auctionId, bidderId: currentUserId, status: 'ACTIVE' } });
    if (bid) myBid = { amount: bid.amount, status: bid.status };
  }

  return { ...auction, isLiked, myBid };
}

export async function cancelAuction(auctionId: string, userId: string) {
  const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
  if (!auction) throw new AppError(404, 'AUCTION_NOT_FOUND', '경매를 찾을 수 없습니다');
  if (auction.hostId !== userId) throw new AppError(403, 'FORBIDDEN', '본인의 경매만 취소할 수 있습니다');
  if (auction.bidCount > 0) throw new AppError(400, 'HAS_BIDS', '입찰이 있는 경매는 취소할 수 없습니다');
  if (auction.status !== 'ACTIVE') throw new AppError(400, 'NOT_ACTIVE', '진행 중인 경매만 취소할 수 있습니다');

  return prisma.auction.update({ where: { id: auctionId }, data: { status: 'CANCELLED' } });
}

export async function endAuction(auctionId: string) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const auction = await tx.auction.findUnique({ where: { id: auctionId }, include: { bids: { orderBy: { amount: 'desc' } } } });
    if (!auction || auction.status !== 'ACTIVE') return null;

    if (auction.bids.length === 0) {
      return tx.auction.update({ where: { id: auctionId }, data: { status: 'FAILED' } });
    }

    const winningBid = auction.bids[0];
    await tx.bid.update({ where: { id: winningBid.id }, data: { status: 'WON' } });

    for (const bid of auction.bids.slice(1)) {
      await tx.bid.update({ where: { id: bid.id }, data: { status: 'REFUNDED' } });
      if (bid.paymentId) {
        await tx.payment.update({ where: { id: bid.paymentId }, data: { status: 'REFUNDED', refundedAt: new Date() } });
      }
    }

    await tx.chatRoom.create({
      data: { auctionId, user1Id: auction.hostId, user2Id: winningBid.bidderId },
    });

    const updatedAuction = await tx.auction.update({
      where: { id: auctionId },
      data: { status: 'ENDED', winnerId: winningBid.bidderId, winningPrice: winningBid.amount, wonAt: new Date() },
    });

    await tx.notification.createMany({
      data: [
        { userId: winningBid.bidderId, type: 'AUCTION_WON', title: '낙찰 축하합니다!', body: `"${auction.title}" 경매에서 ₩${winningBid.amount.toLocaleString()}에 낙찰되었습니다.`, relatedAuctionId: auctionId },
        { userId: auction.hostId, type: 'AUCTION_ENDED', title: '경매가 종료되었습니다', body: `"${auction.title}" 경매가 ₩${winningBid.amount.toLocaleString()}에 낙찰되었습니다.`, relatedAuctionId: auctionId },
      ],
    });

    return updatedAuction;
  });
}

export async function completeMeeting(auctionId: string, userId: string) {
  const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
  if (!auction) throw new AppError(404, 'AUCTION_NOT_FOUND', '경매를 찾을 수 없습니다');
  if (auction.status !== 'ENDED') throw new AppError(400, 'NOT_ENDED', '종료된 경매만 완료할 수 있습니다');

  const isHost = auction.hostId === userId;
  const isWinner = auction.winnerId === userId;
  if (!isHost && !isWinner) throw new AppError(403, 'FORBIDDEN', '경매 참여자만 완료할 수 있습니다');

  const updateData: any = {};
  if (isHost) updateData.hostConfirmedComplete = true;
  if (isWinner) updateData.winnerConfirmedComplete = true;

  const updated = await prisma.auction.update({ where: { id: auctionId }, data: updateData });

  if ((isHost && updated.winnerConfirmedComplete) || (isWinner && updated.hostConfirmedComplete)) {
    const { addBusinessDays } = require('../utils/businessDays');
    const settlementDate = addBusinessDays(new Date(), 5);

    await prisma.auction.update({ where: { id: auctionId }, data: { status: 'COMPLETED' } });

    if (auction.winningPrice) {
      const platformFee = Math.floor(auction.winningPrice * 0.10);
      const hostPayout = auction.winningPrice - platformFee;
      const payment = await prisma.payment.findFirst({ where: { auctionId } });
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { settlementDate, platformFee, hostPayout },
        });
      }
    }
  }

  return updated;
}
