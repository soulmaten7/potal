import prisma from '../config/database';

export async function getFollowingFeed(userId: string, cursor?: string, limit: number = 20) {
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followingIds = [...following.map((f: { followingId: string }) => f.followingId), userId];

  const posts = await prisma.post.findMany({
    where: { authorId: { in: followingIds }, isDeleted: false },
    include: {
      images: { orderBy: { order: 'asc' } },
      author: { select: { id: true, username: true, displayName: true, profileImageUrl: true, verificationBadge: true, tier: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const auctions = await prisma.auction.findMany({
    where: { hostId: { in: followingIds }, status: { in: ['ACTIVE', 'ENDED'] } },
    include: {
      images: { orderBy: { order: 'asc' } },
      host: { select: { id: true, username: true, displayName: true, profileImageUrl: true, verificationBadge: true, tier: true, averageRating: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  const feedItems = [
    ...posts.slice(0, limit).map((p: typeof posts[number]) => ({ type: 'post' as const, data: p, createdAt: p.createdAt })),
    ...auctions.map((a: typeof auctions[number]) => ({ type: 'auction' as const, data: a, createdAt: a.createdAt })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);

  const hasMore = posts.length > limit;
  return { items: feedItems, cursor: hasMore && posts.length > 0 ? posts[Math.min(posts.length - 1, limit - 1)].id : null, hasMore };
}

export async function getLocalFeed(city: string, cursor?: string, limit: number = 20, sort: string = 'ending_soon') {
  const orderBy: Record<string, any> = {
    ending_soon: { endsAt: 'asc' },
    popular: { likeCount: 'desc' },
    newest: { createdAt: 'desc' },
    price_low: { currentPrice: 'asc' },
    price_high: { currentPrice: 'desc' },
  };

  const auctions = await prisma.auction.findMany({
    where: { city: { contains: city }, status: 'ACTIVE' },
    include: {
      images: { orderBy: { order: 'asc' } },
      host: { select: { id: true, username: true, displayName: true, profileImageUrl: true, verificationBadge: true, averageRating: true } },
    },
    orderBy: orderBy[sort] || { endsAt: 'asc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = auctions.length > limit;
  if (hasMore) auctions.pop();

  return { auctions, cursor: hasMore && auctions.length > 0 ? auctions[auctions.length - 1].id : null, hasMore };
}

export async function searchFeed(query: string, type: string = 'all', limit: number = 20) {
  const results: { users?: any[]; posts?: any[]; auctions?: any[] } = {};

  if (type === 'all' || type === 'user') {
    results.users = await prisma.user.findMany({
      where: { OR: [{ username: { contains: query, mode: 'insensitive' } }, { displayName: { contains: query, mode: 'insensitive' } }], isActive: true },
      select: { id: true, username: true, displayName: true, profileImageUrl: true, verificationBadge: true, bio: true },
      take: limit,
    });
  }

  if (type === 'all' || type === 'post') {
    results.posts = await prisma.post.findMany({
      where: { caption: { contains: query, mode: 'insensitive' }, isDeleted: false },
      include: { images: { take: 1, orderBy: { order: 'asc' } }, author: { select: { id: true, username: true, profileImageUrl: true, verificationBadge: true } } },
      take: limit,
    });
  }

  if (type === 'all' || type === 'auction') {
    results.auctions = await prisma.auction.findMany({
      where: { title: { contains: query, mode: 'insensitive' }, status: 'ACTIVE' },
      include: { images: { take: 1, orderBy: { order: 'asc' } }, host: { select: { id: true, username: true, profileImageUrl: true, verificationBadge: true } } },
      take: limit,
    });
  }

  return results;
}
