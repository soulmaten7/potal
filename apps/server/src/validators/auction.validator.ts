import { z } from 'zod';

export const createAuctionSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  auctionDuration: z.enum(['HOURS_24', 'HOURS_48', 'HOURS_72']),
  mealDuration: z.enum(['MIN_60', 'MIN_90', 'MIN_120', 'MIN_150', 'MIN_180']),
  startPrice: z.number().int().min(30000),
  buyNowPrice: z.number().int().optional(),
  city: z.string().min(1),
});

export const placeBidSchema = z.object({
  amount: z.number().int().min(30000),
  isBuyNow: z.boolean().default(false),
});
