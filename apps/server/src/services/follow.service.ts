import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler.middleware';

export async function followUser(followerId: string, targetUsername: string) {
  const target = await prisma.user.findUnique({ where: { username: targetUsername } });
  if (!target) throw new AppError(404, 'USER_NOT_FOUND', '사용자를 찾을 수 없습니다');
  if (target.id === followerId) throw new AppError(400, 'SELF_FOLLOW', '자기 자신을 팔로우할 수 없습니다');

  const existing = await prisma.follow.findUnique({ where: { followerId_followingId: { followerId, followingId: target.id } } });
  if (existing) throw new AppError(409, 'ALREADY_FOLLOWING', '이미 팔로우 중입니다');

  await prisma.follow.create({ data: { followerId, followingId: target.id } });
  await prisma.user.update({ where: { id: followerId }, data: { followingCount: { increment: 1 } } });
  await prisma.user.update({ where: { id: target.id }, data: { followerCount: { increment: 1 } } });

  await prisma.notification.create({
    data: { userId: target.id, type: 'NEW_FOLLOWER', title: '새로운 팔로워', body: '회원님을 팔로우하기 시작했습니다', relatedUserId: followerId },
  });
}

export async function unfollowUser(followerId: string, targetUsername: string) {
  const target = await prisma.user.findUnique({ where: { username: targetUsername } });
  if (!target) throw new AppError(404, 'USER_NOT_FOUND', '사용자를 찾을 수 없습니다');

  const follow = await prisma.follow.findUnique({ where: { followerId_followingId: { followerId, followingId: target.id } } });
  if (!follow) throw new AppError(404, 'NOT_FOLLOWING', '팔로우 중이 아닙니다');

  await prisma.follow.delete({ where: { id: follow.id } });
  await prisma.user.update({ where: { id: followerId }, data: { followingCount: { decrement: 1 } } });
  await prisma.user.update({ where: { id: target.id }, data: { followerCount: { decrement: 1 } } });
}

export async function getFollowers(username: string, cursor?: string, limit: number = 20) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', '사용자를 찾을 수 없습니다');

  const followers = await prisma.follow.findMany({
    where: { followingId: user.id },
    include: { follower: { select: { id: true, username: true, displayName: true, profileImageUrl: true, verificationBadge: true, bio: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = followers.length > limit;
  if (hasMore) followers.pop();
  return { followers: followers.map((f: typeof followers[number]) => f.follower), cursor: hasMore ? followers[followers.length - 1].id : null, hasMore };
}

export async function getFollowing(username: string, cursor?: string, limit: number = 20) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', '사용자를 찾을 수 없습니다');

  const following = await prisma.follow.findMany({
    where: { followerId: user.id },
    include: { following: { select: { id: true, username: true, displayName: true, profileImageUrl: true, verificationBadge: true, bio: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = following.length > limit;
  if (hasMore) following.pop();
  return { following: following.map((f: typeof following[number]) => f.following), cursor: hasMore ? following[following.length - 1].id : null, hasMore };
}
