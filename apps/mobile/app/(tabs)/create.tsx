import React, { useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';

export default function CreateScreen() {
  const { user } = useAuthStore();

  const handleAuction = useCallback(() => {
    if (user?.tier !== 'LEVEL_2') {
      Alert.alert('인증 필요', 'Lv.2 인증을 완료해야 경매를 등록할 수 있습니다.', [
        { text: '취소' },
        { text: '인증하기', onPress: () => router.push('/verification/id-card') },
      ]);
      return;
    }
    router.push('/auction/create');
  }, [user]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>만들기</Text>
        <TouchableOpacity style={styles.option} onPress={() => router.push('/post/create')}>
          <Ionicons name="camera-outline" size={32} color={COLORS.primary} />
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>일반 게시물</Text>
            <Text style={styles.optionDesc}>사진과 함께 게시물을 작성합니다</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={handleAuction}>
          <Ionicons name="hammer-outline" size={32} color={user?.tier === 'LEVEL_2' ? COLORS.primary : COLORS.textSecondary} />
          <View style={styles.optionInfo}>
            <Text style={[styles.optionTitle, user?.tier !== 'LEVEL_2' && styles.disabled]}>경매 등록</Text>
            <Text style={styles.optionDesc}>
              {user?.tier === 'LEVEL_2' ? '식사 시간을 경매에 올립니다' : '인증이 필요합니다 (Lv.2)'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, paddingTop: 100, paddingHorizontal: SPACING.xl },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xxl },
  option: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, marginBottom: SPACING.lg, gap: SPACING.lg },
  optionInfo: { flex: 1 },
  optionTitle: { fontSize: FONT_SIZES.large, fontWeight: '600', color: COLORS.text },
  optionDesc: { fontSize: FONT_SIZES.small, color: COLORS.textSecondary, marginTop: 2 },
  disabled: { color: COLORS.textSecondary },
});
