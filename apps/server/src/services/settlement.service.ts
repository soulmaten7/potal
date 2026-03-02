import prisma from '../config/database';

export async function processSettlements() {
  const now = new Date();
  const payments = await prisma.payment.findMany({
    where: { status: 'ESCROW_HELD', settlementDate: { lte: now } },
  });

  for (const payment of payments) {
    const platformFee = Math.floor(payment.amount * 0.10);
    const hostPayout = payment.amount - platformFee;
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'RELEASED', hostPayout, platformFee, settledAt: new Date() },
    });
  }

  return payments.length;
}
