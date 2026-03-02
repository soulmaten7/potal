import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { auctionService } from '../../services/auctionService';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';

const DURATIONS = [{ label: '24시간', value: 'HOURS_24' }, { label: '48시간', value: 'HOURS_48' }, { label: '72시간', value: 'HOURS_72' }];
const MEAL_TIMES = [{ label: '1시간', value: 'MIN_60' }, { label: '1시간30분', value: 'MIN_90' }, { label: '2시간', value: 'MIN_120' }, { label: '2시간30분', value: 'MIN_150' }, { label: '3시간', value: 'MIN_180' }];

export default function CreateAuctionScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('HOURS_24');
  const [mealDuration, setMealDuration] = useState('MIN_120');
  const [startPrice, setStartPrice] = useState('30000');
  const [buyNowPrice, setBuyNowPrice] = useState('');
  const [city, setCity] = useState('서울 강남구');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, quality: 0.8 });
    if (!result.canceled) setImages(result.assets.map(a => a.uri));
  };

  const handleSubmit = async () => {
    if (!title) { Alert.alert('오류', '제목을 입력하세요'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('auctionDuration', duration);
      formData.append('mealDuration', mealDuration);
      formData.append('startPrice', startPrice);
      if (buyNowPrice) formData.append('buyNowPrice', buyNowPrice);
      formData.append('city', city);
      images.forEach((uri, i) => {
        formData.append('images', { uri, name: `image_${i}.jpg`, type: 'image/jpeg' } as any);
      });
      await auctionService.createAuction(formData);
      Alert.alert('성공', '경매가 등록되었습니다!');
      router.back();
    } catch (e: any) {
      Alert.alert('오류', e.response?.data?.error?.message || '등록에 실패했습니다');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImages}>
        {images.length > 0 ? <Image source={images[0]} style={styles.previewImage} contentFit="cover" /> : <Text style={styles.imageText}>사진 추가 (최대 10장)</Text>}
      </TouchableOpacity>
      <TextInput style={styles.input} placeholder="제목" value={title} onChangeText={setTitle} />
      <TextInput style={[styles.input, styles.textArea]} placeholder="설명 (선택)" value={description} onChangeText={setDescription} multiline numberOfLines={4} />
      <Text style={styles.label}>경매 시간</Text>
      <View style={styles.chips}>{DURATIONS.map(d => (
        <TouchableOpacity key={d.value} style={[styles.chip, duration === d.value && styles.activeChip]} onPress={() => setDuration(d.value)}>
          <Text style={[styles.chipText, duration === d.value && styles.activeChipText]}>{d.label}</Text>
        </TouchableOpacity>
      ))}</View>
      <Text style={styles.label}>식사 시간</Text>
      <View style={styles.chips}>{MEAL_TIMES.map(m => (
        <TouchableOpacity key={m.value} style={[styles.chip, mealDuration === m.value && styles.activeChip]} onPress={() => setMealDuration(m.value)}>
          <Text style={[styles.chipText, mealDuration === m.value && styles.activeChipText]}>{m.label}</Text>
        </TouchableOpacity>
      ))}</View>
      <TextInput style={styles.input} placeholder="시작가 (최소 30,000원)" value={startPrice} onChangeText={setStartPrice} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="즉시낙찰가 (선택)" value={buyNowPrice} onChangeText={setBuyNowPrice} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="도시" value={city} onChangeText={setCity} />
      <TouchableOpacity style={[styles.submit, loading && styles.disabled]} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.submitText}>{loading ? '등록 중...' : '경매 시작하기'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  imagePicker: { height: 200, backgroundColor: '#F5F5F5', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  imageText: { fontSize: FONT_SIZES.large, color: COLORS.textSecondary },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: FONT_SIZES.medium },
  textArea: { height: 100, textAlignVertical: 'top' },
  label: { fontSize: FONT_SIZES.medium, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.md },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  activeChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONT_SIZES.small, color: COLORS.text },
  activeChipText: { color: COLORS.white },
  submit: { backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: SPACING.lg },
  disabled: { opacity: 0.6 },
  submitText: { color: COLORS.white, fontSize: FONT_SIZES.large, fontWeight: '700' },
});
