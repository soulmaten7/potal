import cron from 'node-cron';
import { processSettlements } from '../services/settlement.service';

export function startSettlementJob() {
  cron.schedule('0 0 * * *', async () => {
    try {
      const count = await processSettlements();
      console.log(`Settled ${count} payments`);
    } catch (error) {
      console.error('Settlement job error:', error);
    }
  });
}
