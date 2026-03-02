import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler.middleware';

export async function likePost(userId: string, postId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new AppError(404, 'POST_NOT_FOUND', '게시물을 찾을 수 없습니다');

  const existing = await prisma.like.findFirst({ where: { userId, targetType: 'POST', postId } });
  if (existing) throw new AppError(409, 'ALREADY_LIKED', '이미 좋아요한 게시물입니다');

  await prisma.like.create({ data: { userId, targetType: 'POST', postId } });
  await prisma.post.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } });

  if (post.authorId !== userId) {
    await prisma.notification.create({
      data: { userId: post.authorId, type: 'POST_LIKED', title: '좋아요', body: '회원님의 게시물을 좋아합니다', relatedUserId: userId, relatedPostId: postId },
    });
  }
}

export async function unlikePost(userId: string, postId: string) {
  const like = await prisma.like.findFirst({ where: { userId, targetType: 'POST', postId } });
  if (!like) throw new AppError(404, 'NOT_LIKED', '좋아요하지 않은 게시물입니다');

  await prisma.like.delete({ where: { id: like.id } });
  await prisma.post.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } });
}

export async function likeAuction(userId: string, auctionId: string) {
  const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
  if (!auction) throw new AppError(404, 'AUCTION_NOT_FOUND', '경매를 찾을 수 없습니다');

  const existing = await prisma.like.findFirst({ where: { userId, targetType: 'AUCTION', auctionId } });
  if (existing) throw new AppError(409, 'ALREADY_LIKED', '이미 좋아요한 경매입니다');

  await prisma.like.create({ data: { userId, targetType: 'AUCTION', auctionId } });
  await prisma.auction.update({ where: { id: auctionId }, data: { likeCount: { increment: 1 } } });
}

export async function unlikeAuction(userId: string, auctionId: string) {
  const like = await prisma.like.findFirst({ where: { userId, targetType: 'AUCTION', auctionId } });
  if (!like) throw new AppError(404, 'NOT_LIKED', '좋아요하지 않은 경매입니다');

  await prisma.like.delete({ where: { id: like.id } });
  await prisma.auction.update({ where: { id: auctionId }, data: { likeCount: { decrement: 1 } } });
}
