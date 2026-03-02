import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';

const MENU_ITEMS = [
  { icon: 'person-outline', label: '계정', route: '/settings/account' },
  { icon: 'shield-checkmark-outline', label: 'Lv.2 인증', route: '/verification/id-card' },
  { icon: 'card-outline', label: '결제 관리', route: '/settings/payment' },
  { icon: 'location-outline', label: '위치 설정', route: null },
  { icon: 'notifications-outline', label: '알림 설정', route: null },
  { icon: 'lock-closed-outline', label: '개인정보', route: null },
  { icon: 'information-circle-outline', label: '정보', route: null },
];

export default function SettingsScreen() {
  const { logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃하시겠습니까?', [
      { text: '취소' },
      { text: '로그아웃', style: 'destructive', onPress: async () => { await logout(); router.replace('/auth/login'); } },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {MENU_ITEMS.map(item => (
        <TouchableOpacity key={item.label} style={styles.item} onPress={() => item.route && router.push(item.route as any)} disabled={!item.route}>
          <Ionicons name={item.icon as any} size={22} color={COLORS.text} />
          <Text style={styles.itemText}>{item.label}</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.logoutItem} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color={COLORS.like} />
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  item: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 0.5, borderBottomColor: COLORS.border, gap: SPACING.md },
  itemText: { flex: 1, fontSize: FONT_SIZES.large, color: COLORS.text },
  logoutItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, gap: SPACING.md, marginTop: SPACING.xl },
  logoutText: { fontSize: FONT_SIZES.large, color: COLORS.like },
});
