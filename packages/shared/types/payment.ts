export type PaymentStatus = 'PENDING' | 'ESCROW_HELD' | 'RELEASED' | 'REFUNDED' | 'PENALTY_CHARGED' | 'FAILED';
export type PaymentType = 'BID_DEPOSIT' | 'SETTLEMENT' | 'REFUND' | 'PENALTY';

export interface Payment {
  id: string;
  userId: string;
  auctionId: string | null;
  type: PaymentType;
  amount: number;
  platformFee: number;
  hostPayout: number;
  status: PaymentStatus;
  tossPaymentKey: string | null;
  tossOrderId: string | null;
  settlementDate: string | null;
  settledAt: string | null;
  refundedAt: string | null;
  refundReason: string | null;
  penaltyReason: string | null;
  createdAt: string;
  updatedAt: string;
}
