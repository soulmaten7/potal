import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { errorHandler } from './middlewares/errorHandler.middleware';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import followRoutes from './routes/follow.routes';
import postRoutes from './routes/post.routes';
import feedRoutes from './routes/feed.routes';
import auctionRoutes from './routes/auction.routes';
import chatRoutes from './routes/chat.routes';
import notificationRoutes from './routes/notification.routes';
import verificationRoutes from './routes/verification.routes';
import reviewRoutes from './routes/review.routes';
import reportRoutes from './routes/report.routes';
import blockRoutes from './routes/block.routes';
import paymentRoutes from './routes/payment.routes';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

app.use('/v1/auth', authRoutes);
app.use('/v1/users', userRoutes);
app.use('/v1/users', followRoutes);
app.use('/v1/users', blockRoutes);
app.use('/v1/posts', postRoutes);
app.use('/v1/feed', feedRoutes);
app.use('/v1/auctions', auctionRoutes);
app.use('/v1/chat', chatRoutes);
app.use('/v1/notifications', notificationRoutes);
app.use('/v1/verification', verificationRoutes);
app.use('/v1', reviewRoutes);
app.use('/v1/reports', reportRoutes);
app.use('/v1/payments', paymentRoutes);

app.get('/health', (_req, res) => { res.json({ status: 'ok', timestamp: new Date().toISOString() }); });

app.use(errorHandler);

export default app;
