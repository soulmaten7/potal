import api from './api';

export const auctionService = {
  createAuction: (formData: FormData) =>
    api.post('/auctions', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAuction: (auctionId: string) => api.get(`/auctions/${auctionId}`),
  placeBid: (auctionId: string, data: { amount: number; isBuyNow?: boolean }) =>
    api.post(`/auctions/${auctionId}/bid`, data),
  cancelAuction: (auctionId: string) => api.delete(`/auctions/${auctionId}`),
  likeAuction: (auctionId: string) => api.post(`/auctions/${auctionId}/like`),
  unlikeAuction: (auctionId: string) => api.delete(`/auctions/${auctionId}/like`),
  completeMeeting: (auctionId: string) => api.post(`/auctions/${auctionId}/complete`),
};
