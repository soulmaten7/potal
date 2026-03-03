import prisma from '../config/database';

export async function processSettlements() {
  const now = new Date();

  // Find payments where:
  // 1. Both parties confirmed meal completion (status = PENDING_SETTLEMENT)
  // 2. 5 business days have passed (settlementDate <= now)
  const payments = await prisma.payment.findMany({
    where: {
      status: 'PENDING_SETTLEMENT',
      settlementDate: { lte: now },
    },
  });

  let settledCount = 0;

  for (const payment of payments) {
    try {
      const platformFee = Math.floor(payment.amount * 0.10);
      const hostPayout = payment.amount - platformFee;

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'RELEASED', hostPayout, platformFee, settledAt: new Date() },
        });
      });

      settledCount++;
      console.log(`Settlement processed: payment ${payment.id}, ₩${hostPayout} to host`);
    } catch (error) {
      // Continue processing other payments even if one fails
      console.error(`Settlement failed for payment ${payment.id}:`, error);
    }
  }

  return settledCount;
}
