import { useEffect, useState, useCallback } from 'react';
import { useAuctionStore } from '../stores/auctionStore';
import { useSocket } from './useSocket';

export function useAuction(auctionId: string) {
  const { currentAuction, isLoading, fetchAuction } = useAuctionStore();
  const [remainingMs, setRemainingMs] = useState(0);
  const socketRef = useSocket('/auction');

  useEffect(() => {
    fetchAuction(auctionId);
  }, [auctionId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('join_auction', auctionId);

    socket.on('auction_timer_sync', (data: any) => {
      if (data.auctionId === auctionId) {
        setRemainingMs(data.remainingMs);
      }
    });

    socket.on('auction_bid_update', (data: any) => {
      fetchAuction(auctionId);
    });

    socket.on('auction_ended', (data: any) => {
      fetchAuction(auctionId);
    });

    return () => {
      socket.emit('leave_auction', auctionId);
      socket.off('auction_timer_sync');
      socket.off('auction_bid_update');
      socket.off('auction_ended');
    };
  }, [auctionId, socketRef.current]);

  useEffect(() => {
    if (currentAuction?.endsAt) {
      const timer = setInterval(() => {
        const remaining = new Date(currentAuction.endsAt).getTime() - Date.now();
        setRemainingMs(Math.max(0, remaining));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentAuction?.endsAt]);

  return { auction: currentAuction, isLoading, remainingMs, refresh: () => fetchAuction(auctionId) };
}
