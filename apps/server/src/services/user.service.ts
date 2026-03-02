import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler.middleware';

export async function getUserByUsername(username: string, currentUserId?: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true, email: true, username: true, displayName: true, bio: true,
      profileImageUrl: true, websiteUrl: true, tier: true, verificationStatus: true,
      verificationBadge: true, followerCount: true, followingCount: true,
      postCount: true, auctionCount: true, averageRating: true, totalRatingCount: true,
      city: true, isPrivate: true, createdAt: true,
    },
  });
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', '사용자를 찾을 수 없습니다');

  let isFollowing = false;
  if (currentUserId && currentUserId !== user.id) {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: currentUserId, followingId: user.id } },
    });
    isFollowing = !!follow;
  }

  return { ...user, isFollowing };
}

export async function updateProfile(userId: string, data: { displayName?: string; bio?: string; websiteUrl?: string; city?: string }) {
  return prisma.user.update({ where: { id: userId }, data });
}

export async function updateProfileImage(userId: string, imageUrl: string) {
  return prisma.user.update({ where: { id: userId }, data: { profileImageUrl: imageUrl } });
}
