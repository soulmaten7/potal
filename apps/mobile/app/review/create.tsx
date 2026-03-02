import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import StarRating from '../../components/review/StarRating';
import api from '../../services/api';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';

export default function CreateReviewScreen() {
  const { auctionId } = useLocalSearchParams<{ auctionId: string }>();
  const [rating, setRating] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [manner, setManner] = useState(5);
  const [conversation, setConversation] = useState(5);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post(`/auctions/${auctionId}/reviews`, { rating, punctuality, manner, conversation, content });
      Alert.alert('완료', '리뷰가 등록되었습니다');
      router.back();
    } catch (e: any) {
      Alert.alert('오류', e.response?.data?.error?.message || '실패했습니다');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>리뷰 작성</Text>
      <RatingRow label="전체 평점" rating={rating} onRate={setRating} />
      <RatingRow label="시간 준수" rating={punctuality} onRate={setPunctuality} />
      <RatingRow label="매너" rating={manner} onRate={setManner} />
      <RatingRow label="대화 퀄리티" rating={conversation} onRate={setConversation} />
      <TextInput style={[styles.input, styles.textArea]} placeholder="리뷰를 작성해주세요 (선택, 최대 500자)" value={content} onChangeText={setContent} multiline maxLength={500} />
      <TouchableOpacity style={[styles.submit, loading && styles.disabled]} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.submitText}>{loading ? '등록 중...' : '리뷰 등록'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function RatingRow({ label, rating, onRate }: { label: string; rating: number; onRate: (r: number) => void }) {
  return (
    <View style={ratingRowStyles.row}>
      <Text style={ratingRowStyles.label}>{label}</Text>
      <StarRating rating={rating} onRate={onRate} size={24} />
    </View>
  );
}

const ratingRowStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  label: { fontSize: FONT_SIZES.large, color: COLORS.text },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.xl },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xl },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, marginTop: SPACING.md, fontSize: FONT_SIZES.medium },
  textArea: { height: 120, textAlignVertical: 'top' },
  submit: { backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: SPACING.xl },
  disabled: { opacity: 0.6 },
  submitText: { color: COLORS.white, fontSize: FONT_SIZES.large, fontWeight: '600' },
});
