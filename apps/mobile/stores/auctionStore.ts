import { create } from 'zustand';
import { auctionService } from '../services/auctionService';

interface AuctionState {
  currentAuction: any | null;
  isLoading: boolean;
  fetchAuction: (id: string) => Promise<void>;
  placeBid: (auctionId: string, amount: number, isBuyNow?: boolean) => Promise<any>;
}

export const useAuctionStore = create<AuctionState>((set) => ({
  currentAuction: null,
  isLoading: false,

  fetchAuction: async (id) => {
    set({ isLoading: true });
    try {
      const { data } = await auctionService.getAuction(id);
      set({ currentAuction: data.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  placeBid: async (auctionId, amount, isBuyNow = false) => {
    const { data } = await auctionService.placeBid(auctionId, { amount, isBuyNow });
    return data.data;
  },
}));
