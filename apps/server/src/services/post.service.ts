import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler.middleware';

export async function createPost(authorId: string, caption: string | undefined, imageUrls: string[], locationName?: string) {
  const post = await prisma.post.create({
    data: {
      authorId,
      caption,
      locationName,
      images: {
        create: imageUrls.map((url, i) => ({ imageUrl: url, order: i })),
      },
    },
    include: { images: true, author: { select: { id: true, username: true, displayName: true, profileImageUrl: true, verificationBadge: true } } },
  });

  await prisma.user.update({ where: { id: authorId }, data: { postCount: { increment: 1 } } });
  return post;
}

export async function getPostById(postId: string, currentUserId?: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId, isDeleted: false },
    include: {
      images: { orderBy: { order: 'asc' } },
      author: { select: { id: true, username: true, displayName: true, profileImageUrl: true, verificationBadge: true, tier: true } },
    },
  });
  if (!post) throw new AppError(404, 'POST_NOT_FOUND', '게시물을 찾을 수 없습니다');

  let isLiked = false;
  if (currentUserId) {
    const like = await prisma.like.findFirst({ where: { userId: currentUserId, targetType: 'POST', postId } });
    isLiked = !!like;
  }

  return { ...post, isLiked };
}

export async function deletePost(postId: string, userId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new AppError(404, 'POST_NOT_FOUND', '게시물을 찾을 수 없습니다');
  if (post.authorId !== userId) throw new AppError(403, 'FORBIDDEN', '본인의 게시물만 삭제할 수 있습니다');

  await prisma.post.update({ where: { id: postId }, data: { isDeleted: true } });
  await prisma.user.update({ where: { id: userId }, data: { postCount: { decrement: 1 } } });
}

export async function getUserPosts(username: string, cursor?: string, limit: number = 20) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', '사용자를 찾을 수 없습니다');

  const posts = await prisma.post.findMany({
    where: { authorId: user.id, isDeleted: false },
    include: { images: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = posts.length > limit;
  if (hasMore) posts.pop();

  return { posts, cursor: hasMore ? posts[posts.length - 1].id : null, hasMore };
}
