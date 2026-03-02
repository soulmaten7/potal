import { useCallback } from 'react';
import { useFeedStore } from '../stores/feedStore';

export function useFeed() {
  const { followingFeed, localFeed, isLoading, hasMore, fetchFollowingFeed, fetchLocalFeed } = useFeedStore();

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchFollowingFeed(false);
    }
  }, [isLoading, hasMore]);

  const refresh = useCallback(() => {
    fetchFollowingFeed(true);
  }, []);

  return { followingFeed, localFeed, isLoading, hasMore, loadMore, refresh, fetchLocalFeed };
}
