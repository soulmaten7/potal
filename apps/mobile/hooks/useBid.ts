import { useState } from 'react';
import { useAuctionStore } from '../stores/auctionStore';
import { Alert } from 'react-native';

export function useBid() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { placeBid } = useAuctionStore();

  const submitBid = async (auctionId: string, amount: number, isBuyNow: boolean = false) => {
    setIsSubmitting(true);
    try {
      const result = await placeBid(auctionId, amount, isBuyNow);
      Alert.alert('입찰 성공', `₩${amount.toLocaleString()} 입찰이 완료되었습니다.`);
      return result;
    } catch (error: any) {
      const message = error.response?.data?.error?.message || '입찰에 실패했습니다';
      Alert.alert('입찰 실패', message);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitBid, isSubmitting };
}
