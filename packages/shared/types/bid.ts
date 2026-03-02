export type BidStatus = 'ACTIVE' | 'OUTBID' | 'WON' | 'CANCELLED' | 'REFUNDED';

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  amount: number;
  status: BidStatus;
  paymentId: string | null;
  isBuyNow: boolean;
  createdAt: string;
  updatedAt: string;
}
