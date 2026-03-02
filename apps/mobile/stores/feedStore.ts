import { create } from 'zustand';
import { feedService } from '../services/feedService';

interface FeedItem {
  type: 'post' | 'auction';
  data: any;
  createdAt: string;
}

interface FeedState {
  followingFeed: FeedItem[];
  localFeed: any[];
  isLoading: boolean;
  cursor: string | null;
  hasMore: boolean;
  fetchFollowingFeed: (refresh?: boolean) => Promise<void>;
  fetchLocalFeed: (city?: string, sort?: string, refresh?: boolean) => Promise<void>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  followingFeed: [],
  localFeed: [],
  isLoading: false,
  cursor: null,
  hasMore: true,

  fetchFollowingFeed: async (refresh = false) => {
    const state = get();
    if (state.isLoading) return;
    set({ isLoading: true });
    try {
      const cursor = refresh ? undefined : state.cursor || undefined;
      const { data } = await feedService.getFollowingFeed(cursor);
      const items = data.data || [];
      set({
        followingFeed: refresh ? items : [...state.followingFeed, ...items],
        cursor: data.pagination?.cursor || null,
        hasMore: data.pagination?.hasMore || false,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchLocalFeed: async (city, sort, refresh = false) => {
    set({ isLoading: true });
    try {
      const { data } = await feedService.getLocalFeed(city, undefined, sort);
      set({ localFeed: data.data || [], isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));
