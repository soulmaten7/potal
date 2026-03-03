export type NotificationType =
  | 'AUCTION_NEW_BID'
  | 'AUCTION_OUTBID'
  | 'AUCTION_WON'
  | 'AUCTION_ENDED'
  | 'AUCTION_FAILED'
  | 'BID_REFUNDED'
  | 'MEETING_COMPLETED'
  | 'NEW_FOLLOWER'
  | 'POST_LIKED'
  | 'AUCTION_LIKED'
  | 'NEW_MESSAGE'
  | 'NEW_REVIEW'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_REFUNDED'
  | 'SETTLEMENT_COMPLETED'
  | 'VERIFICATION_APPROVED'
  | 'VERIFICATION_REJECTED'
  | 'ACCOUNT_WARNING';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedUserId: string | null;
  relatedAuctionId: string | null;
  relatedPostId: string | null;
  relatedChatRoomId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}
