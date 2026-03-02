import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { userService } from '../../services/userService';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';

export default function AccountSettingsScreen() {
  const { user, setUser } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [city, setCity] = useState(user?.city || '');

  const handleSave = async () => {
    try {
      await userService.updateProfile({ displayName, bio, city });
      if (user) setUser({ ...user, displayName, bio, city });
      Alert.alert('저장 완료', '프로필이 업데이트되었습니다');
    } catch { Alert.alert('오류', '저장에 실패했습니다'); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>이름</Text>
      <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />
      <Text style={styles.label}>소개</Text>
      <TextInput style={[styles.input, styles.bio]} value={bio} onChangeText={setBio} multiline maxLength={150} />
      <Text style={styles.label}>도시</Text>
      <TextInput style={styles.input} value={city} onChangeText={setCity} />
      <TouchableOpacity style={styles.save} onPress={handleSave}>
        <Text style={styles.saveText}>저장</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.xl },
  label: { fontSize: FONT_SIZES.medium, fontWeight: '600', color: COLORS.text, marginBottom: 4, marginTop: SPACING.md },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, fontSize: FONT_SIZES.medium },
  bio: { height: 80, textAlignVertical: 'top' },
  save: { backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: SPACING.xxl },
  saveText: { color: COLORS.white, fontSize: FONT_SIZES.large, fontWeight: '600' },
});
