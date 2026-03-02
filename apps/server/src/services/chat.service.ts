import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler.middleware';

export async function getChatRooms(userId: string) {
  const rooms = await prisma.chatRoom.findMany({
    where: { OR: [{ user1Id: userId }, { user2Id: userId }], isActive: true },
    include: {
      user1: { select: { id: true, username: true, displayName: true, profileImageUrl: true, verificationBadge: true } },
      user2: { select: { id: true, username: true, displayName: true, profileImageUrl: true, verificationBadge: true } },
      auction: { select: { title: true, winningPrice: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return rooms.map((room: typeof rooms[number]) => {
    const unreadCount = 0; // simplified
    return { ...room, lastMessage: room.messages[0] || null, unreadCount };
  });
}

export async function getChatMessages(roomId: string, userId: string, cursor?: string, limit: number = 50) {
  const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
  if (!room) throw new AppError(404, 'ROOM_NOT_FOUND', '채팅방을 찾을 수 없습니다');
  if (room.user1Id !== userId && room.user2Id !== userId) throw new AppError(403, 'FORBIDDEN', '채팅방에 접근할 수 없습니다');

  const messages = await prisma.chatMessage.findMany({
    where: { chatRoomId: roomId },
    include: { sender: { select: { id: true, username: true, displayName: true, profileImageUrl: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = messages.length > limit;
  if (hasMore) messages.pop();
  return { messages: messages.reverse(), cursor: hasMore ? messages[0].id : null, hasMore };
}

export async function sendMessage(roomId: string, senderId: string, content: string, imageUrl?: string) {
  const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
  if (!room) throw new AppError(404, 'ROOM_NOT_FOUND', '채팅방을 찾을 수 없습니다');
  if (room.user1Id !== senderId && room.user2Id !== senderId) throw new AppError(403, 'FORBIDDEN', '채팅방에 접근할 수 없습니다');

  const message = await prisma.chatMessage.create({
    data: { chatRoomId: roomId, senderId, content, imageUrl },
    include: { sender: { select: { id: true, username: true, displayName: true, profileImageUrl: true } } },
  });

  await prisma.chatRoom.update({ where: { id: roomId }, data: { updatedAt: new Date() } });

  const receiverId = room.user1Id === senderId ? room.user2Id : room.user1Id;
  await prisma.notification.create({
    data: { userId: receiverId, type: 'NEW_MESSAGE', title: '새 메시지', body: content.substring(0, 100), relatedChatRoomId: roomId, relatedUserId: senderId },
  });

  return message;
}
