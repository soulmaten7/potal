import http from 'http';
import app from './app';
import { env } from './config/env';
import { setupSocket } from './socket';
import { startAuctionEndJob } from './jobs/auctionEnd.job';
import { startSettlementJob } from './jobs/settlement.job';

const server = http.createServer(app);
const io = setupSocket(server);

(app as any).io = io;

startAuctionEndJob(io);
startSettlementJob();

server.listen(env.PORT, () => {
  console.log(`BidTable server running on port ${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});
