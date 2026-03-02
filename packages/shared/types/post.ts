import { User } from './user';

export interface PostImage {
  id: string;
  postId: string;
  imageUrl: string;
  width: number | null;
  height: number | null;
  order: number;
}

export interface Post {
  id: string;
  authorId: string;
  author?: User;
  caption: string | null;
  likeCount: number;
  locationName: string | null;
  images: PostImage[];
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}
