import React from 'react';
import PostCard from './PostCard';
import AuctionCard from './AuctionCard';

interface FeedCardProps {
  item: { type: 'post' | 'auction'; data: any };
}

export default function FeedCard({ item }: FeedCardProps) {
  if (item.type === 'auction') return <AuctionCard auction={item.data} />;
  return <PostCard post={item.data} />;
}
