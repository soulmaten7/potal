export type UserTier = 'LEVEL_1' | 'LEVEL_2';
export type VerificationStatus = 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string | null;
  profileImageUrl: string | null;
  websiteUrl: string | null;
  tier: UserTier;
  verificationStatus: VerificationStatus;
  verificationBadge: boolean;
  followerCount: number;
  followingCount: number;
  postCount: number;
  auctionCount: number;
  averageRating: number;
  totalRatingCount: number;
  city: string | null;
  isActive: boolean;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface UserProfile extends User {
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  isBlocked?: boolean;
}

export interface UserVerification {
  id: string;
  userId: string;
  idCardVerified: boolean;
  idCardType: string | null;
  realName: string | null;
  birthDate: string | null;
  faceVerified: boolean;
  livenessScore: number | null;
  verifiedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
}
