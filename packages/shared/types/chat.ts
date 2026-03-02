import { User } from './user';

export interface ChatRoom {
  id: string;
  auctionId: string;
  user1Id: string;
  user2Id: string;
  user1?: User;
  user2?: User;
  isActive: boolean;
  lastMessage?: ChatMessage;
  unreadCount?: number;
  auctionTitle?: string;
  winningPrice?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  sender?: User;
  content: string;
  imageUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}
