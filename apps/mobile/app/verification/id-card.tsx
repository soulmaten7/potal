import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { verificationService } from '../../services/verificationService';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';

const ID_TYPES = ['주민등록증', '운전면허증', '여권'];

export default function IdCardVerificationScreen() {
  const [idCardType, setIdCardType] = useState('주민등록증');
  const [realName, setRealName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!realName || !birthDate) { Alert.alert('오류', '이름과 생년월일을 입력하세요'); return; }
    setLoading(true);
    try {
      await verificationService.verifyIdCard({ idCardType, realName, birthDate });
      Alert.alert('인증 완료', '신분증 인증이 완료되었습니다.', [
        { text: '다음', onPress: () => router.replace('/verification/face') },
      ]);
    } catch { Alert.alert('오류', '인증에 실패했습니다'); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>신분증 인증</Text>
      <Text style={styles.subtitle}>본인 확인을 위해 신분증 정보를 입력해주세요</Text>
      <Text style={styles.label}>신분증 종류</Text>
      <View style={styles.chips}>
        {ID_TYPES.map(t => (
          <TouchableOpacity key={t} style={[styles.chip, idCardType === t && styles.activeChip]} onPress={() => setIdCardType(t)}>
            <Text style={[styles.chipText, idCardType === t && styles.activeChipText]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput style={styles.input} placeholder="이름" value={realName} onChangeText={setRealName} />
      <TextInput style={styles.input} placeholder="생년월일 (YYYY-MM-DD)" value={birthDate} onChangeText={setBirthDate} />
      <TouchableOpacity style={[styles.submit, loading && styles.disabled]} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.submitText}>{loading ? '인증 중...' : '인증하기'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.xl },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: FONT_SIZES.medium, color: COLORS.textSecondary, marginTop: 8, marginBottom: SPACING.xl },
  label: { fontSize: FONT_SIZES.medium, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  chips: { flexDirection: 'row', gap: 8, marginBottom: SPACING.lg },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  activeChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONT_SIZES.small, color: COLORS.text },
  activeChipText: { color: COLORS.white },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: FONT_SIZES.medium },
  submit: { backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: SPACING.lg },
  disabled: { opacity: 0.6 },
  submitText: { color: COLORS.white, fontSize: FONT_SIZES.large, fontWeight: '600' },
});
