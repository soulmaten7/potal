import prisma from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export async function holdEscrow(userId: string, amount: number) {
  return prisma.payment.create({
    data: { userId, amount, type: 'BID_DEPOSIT', status: 'ESCROW_HELD', tossPaymentKey: `mock_${uuidv4()}`, tossOrderId: `order_${uuidv4()}` },
  });
}

export async function refundEscrow(paymentId: string) {
  return prisma.payment.update({ where: { id: paymentId }, data: { status: 'REFUNDED', refundedAt: new Date() } });
}

export async function releaseEscrow(paymentId: string, hostPayout: number, platformFee: number) {
  return prisma.payment.update({ where: { id: paymentId }, data: { status: 'RELEASED', hostPayout, platformFee, settledAt: new Date() } });
}
