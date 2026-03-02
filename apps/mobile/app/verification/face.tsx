import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { verificationService } from '../../services/verificationService';
import { useAuthStore } from '../../stores/authStore';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';

export default function FaceVerificationScreen() {
  const [status, setStatus] = useState<'scanning' | 'success'>('scanning');
  const { setUser, user } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        await verificationService.verifyFace();
        setStatus('success');
        if (user) setUser({ ...user, tier: 'LEVEL_2', verificationBadge: true });
        setTimeout(() => router.replace('/(tabs)'), 2000);
      } catch {}
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.circle}>
        {status === 'scanning' ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
        )}
      </View>
      <Text style={styles.title}>{status === 'scanning' ? '안면 인식 중...' : '인증 완료!'}</Text>
      <Text style={styles.subtitle}>
        {status === 'scanning' ? '카메라를 정면으로 바라봐 주세요' : 'Lv.2 인증이 완료되었습니다'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  circle: { width: 200, height: 200, borderRadius: 100, borderWidth: 3, borderColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xxl },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: FONT_SIZES.medium, color: COLORS.textSecondary, marginTop: 8, textAlign: 'center' },
});
