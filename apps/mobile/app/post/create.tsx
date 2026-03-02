import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { postService } from '../../services/postService';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';

export default function CreatePostScreen() {
  const [caption, setCaption] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, quality: 0.8 });
    if (!result.canceled) setImages(result.assets.map(a => a.uri));
  };

  const handleSubmit = async () => {
    if (images.length === 0) { Alert.alert('오류', '사진을 선택하세요'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('caption', caption);
      images.forEach((uri, i) => {
        formData.append('images', { uri, name: `image_${i}.jpg`, type: 'image/jpeg' } as any);
      });
      await postService.createPost(formData);
      Alert.alert('성공', '게시물이 작성되었습니다!');
      router.back();
    } catch (e: any) {
      Alert.alert('오류', e.response?.data?.error?.message || '실패했습니다');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImages}>
        {images.length > 0 ? <Image source={images[0]} style={styles.previewImage} contentFit="cover" /> : <Text style={styles.imageText}>사진 선택</Text>}
      </TouchableOpacity>
      <TextInput style={[styles.input, styles.textArea]} placeholder="문구 입력..." value={caption} onChangeText={setCaption} multiline numberOfLines={4} />
      <TouchableOpacity style={[styles.submit, loading && styles.disabled]} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.submitText}>{loading ? '공유 중...' : '공유'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  imagePicker: { height: 300, backgroundColor: '#F5F5F5', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  imageText: { fontSize: FONT_SIZES.xl, color: COLORS.textSecondary },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: FONT_SIZES.medium },
  textArea: { height: 120, textAlignVertical: 'top' },
  submit: { backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  disabled: { opacity: 0.6 },
  submitText: { color: COLORS.white, fontSize: FONT_SIZES.large, fontWeight: '600' },
});
