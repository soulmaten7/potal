import { User } from './user';

export type AuctionStatus = 'DRAFT' | 'ACTIVE' | 'ENDED' | 'FAILED' | 'CANCELLED' | 'COMPLETED';
export type AuctionDuration = 'HOURS_24' | 'HOURS_48' | 'HOURS_72';
export type MealDuration = 'MIN_60' | 'MIN_90' | 'MIN_120' | 'MIN_150' | 'MIN_180';

export interface AuctionImage {
  id: string;
  auctionId: string;
  imageUrl: string;
  width: number | null;
  height: number | null;
  order: number;
}

export interface Auction {
  id: string;
  hostId: string;
  host?: User;
  title: string;
  description: string | null;
  auctionDuration: AuctionDuration;
  mealDuration: MealDuration;
  startPrice: number;
  buyNowPrice: number | null;
  currentPrice: number;
  startsAt: string;
  endsAt: string;
  mealDate: string | null;
  restaurantName: string | null;
  restaurantAddress: string | null;
  city: string;
  status: AuctionStatus;
  winnerId: string | null;
  winningPrice: number | null;
  wonAt: string | null;
  bidCount: number;
  likeCount: number;
  viewCount: number;
  images: AuctionImage[];
  isLiked?: boolean;
  myBid?: { amount: number; status: string } | null;
  createdAt: string;
  updatedAt: string;
}
