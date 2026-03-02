import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuthStore();

  const handleSignup = async () => {
    if (!email || !password || !username || !displayName) { Alert.alert('오류', '모든 필드를 입력하세요'); return; }
    setLoading(true);
    try {
      await signup(email, password, username, displayName);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('가입 실패', error.response?.data?.error?.message || '다시 시도해주세요');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>BidTable</Text>
        <Text style={styles.subtitle}>새 계정 만들기</Text>
        <TextInput style={styles.input} placeholder="이메일" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="사용자 이름 (영문, 숫자)" value={username} onChangeText={setUsername} autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="이름" value={displayName} onChangeText={setDisplayName} />
        <TextInput style={styles.input} placeholder="비밀번호 (8자 이상)" value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={[styles.button, loading && styles.disabled]} onPress={handleSignup} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? '가입 중...' : '가입하기'}</Text>
        </TouchableOpacity>
        <View style={styles.loginRow}>
          <Text style={styles.loginText}>이미 계정이 있으신가요? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.loginLink}>로그인</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 40, paddingVertical: 40 },
  logo: { fontSize: 40, fontWeight: '700', textAlign: 'center', color: COLORS.text },
  subtitle: { fontSize: FONT_SIZES.large, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 30, marginTop: 8 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: FONT_SIZES.medium, backgroundColor: '#FAFAFA' },
  button: { backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: FONT_SIZES.large, fontWeight: '600' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.medium },
  loginLink: { color: COLORS.primary, fontSize: FONT_SIZES.medium, fontWeight: '600' },
});
