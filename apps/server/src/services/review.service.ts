import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler.middleware';

export async function createReview(auctionId: string, authorId: string, data: {
  rating: number; content?: string; punctuality?: number; manner?: number; conversation?: number;
}) {
  const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
  if (!auction) throw new AppError(404, 'AUCTION_NOT_FOUND', '경매를 찾을 수 없습니다');
  if (auction.status !== 'COMPLETED') throw new AppError(400, 'NOT_COMPLETED', '완료된 경매만 리뷰할 수 있습니다');

  const isHost = auction.hostId === authorId;
  const isWinner = auction.winnerId === authorId;
  if (!isHost && !isWinner) throw new AppError(403, 'FORBIDDEN', '경매 참여자만 리뷰를 작성할 수 있습니다');

  const targetId = isHost ? auction.winnerId! : auction.hostId;

  const review = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const r = await tx.review.create({
      data: { auctionId, authorId, targetId, rating: data.rating, content: data.content, punctuality: data.punctuality, manner: data.manner, conversation: data.conversation },
    });

    const reviews = await tx.review.findMany({ where: { targetId }, select: { rating: true } });
    const avg = reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length;
    await tx.user.update({ where: { id: targetId }, data: { averageRating: Math.round(avg * 10) / 10, totalRatingCount: reviews.length } });

    await tx.notification.create({
      data: { userId: targetId, type: 'NEW_REVIEW', title: '새로운 리뷰', body: `별점 ${data.rating}점 리뷰가 작성되었습니다`, relatedAuctionId: auctionId, relatedUserId: authorId },
    });

    return r;
  });

  return review;
}

export async function getUserReviews(username: string, cursor?: string, limit: number = 20) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', '사용자를 찾을 수 없습니다');

  const reviews = await prisma.review.findMany({
    where: { targetId: user.id, isPublic: true },
    include: {
      author: { select: { id: true, username: true, displayName: true, profileImageUrl: true, verificationBadge: true } },
      auction: { select: { title: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = reviews.length > limit;
  if (hasMore) reviews.pop();
  return { reviews, cursor: hasMore ? reviews[reviews.length - 1].id : null, hasMore };
}
