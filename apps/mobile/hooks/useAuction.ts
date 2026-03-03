import { useEffect, useState, useRef } from 'react';
import { useAuctionStore } from '../stores/auctionStore';
import { useSocket } from './useSocket';

export function useAuction(auctionId: string) {
  const { currentAuction, isLoading, fetchAuction } = useAuctionStore();
  const [remainingMs, setRemainingMs] = useState(0);
  const { on, off, emit, isConnected } = useSocket('/auction');
  const serverTimeOffsetRef = useRef(0); // Diff between server and client time

  useEffect(() => {
    fetchAuction(auctionId);
  }, [auctionId]);

  // Join/leave auction room and subscribe to events
  useEffect(() => {
    if (!isConnected) return;

    emit('join_auction', auctionId);

    const handleTimerSync = (data: { auctionId: string; remainingMs: number; serverTime: number }) => {
      if (data.auctionId === auctionId) {
        // Calculate server-client time offset for accurate local countdown
        if (data.serverTime) {
          serverTimeOffsetRef.current = data.serverTime - Date.now();
        }
        setRemainingMs(data.remainingMs);
      }
    };

    const handleBidUpdate = (data: { auctionId: string }) => {
      if (data.auctionId === auctionId) {
        fetchAuction(auctionId);
      }
    };

    const handleAuctionEnded = (data: { auctionId: string }) => {
      if (data.auctionId === auctionId) {
        fetchAuction(auctionId);
      }
    };

    on('auction_timer_sync', handleTimerSync);
    on('auction_bid_update', handleBidUpdate);
    on('auction_ended', handleAuctionEnded);

    return () => {
      emit('leave_auction', auctionId);
      off('auction_timer_sync', handleTimerSync);
      off('auction_bid_update', handleBidUpdate);
      off('auction_ended', handleAuctionEnded);
    };
  }, [auctionId, isConnected, on, off, emit]);

  // Local countdown timer (between server syncs)
  useEffect(() => {
    if (currentAuction?.endsAt) {
      const timer = setInterval(() => {
        const serverNow = Date.now() + serverTimeOffsetRef.current;
        const remaining = new Date(currentAuction.endsAt).getTime() - serverNow;
        setRemainingMs(Math.max(0, remaining));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentAuction?.endsAt]);

  return { auction: currentAuction, isLoading, remainingMs, refresh: () => fetchAuction(auctionId) };
}
