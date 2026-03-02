import api from './api';

export const userService = {
  getProfile: (username: string) => api.get(`/users/${username}`),
  updateProfile: (data: any) => api.put('/users/me', data),
  updateProfileImage: (formData: FormData) =>
    api.put('/users/me/profile-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getUserPosts: (username: string, cursor?: string) =>
    api.get(`/users/${username}/posts`, { params: { cursor } }),
  follow: (username: string) => api.post(`/users/${username}/follow`),
  unfollow: (username: string) => api.delete(`/users/${username}/follow`),
  getFollowers: (username: string, cursor?: string) =>
    api.get(`/users/${username}/followers`, { params: { cursor } }),
  getFollowing: (username: string, cursor?: string) =>
    api.get(`/users/${username}/following`, { params: { cursor } }),
};
