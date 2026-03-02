import api from './api';

export const feedService = {
  getFollowingFeed: (cursor?: string) =>
    api.get('/feed/following', { params: { cursor } }),
  getLocalFeed: (city?: string, cursor?: string, sort?: string) =>
    api.get('/feed/local', { params: { city, cursor, sort } }),
  search: (q: string, type?: string) =>
    api.get('/feed/search', { params: { q, type } }),
};
