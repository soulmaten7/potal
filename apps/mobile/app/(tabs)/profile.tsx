import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ProfileHeader from '../../components/profile/ProfileHeader';
import ProfileGrid from '../../components/profile/ProfileGrid';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuthStore } from '../../stores/authStore';
import { userService } from '../../services/userService';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [profileData, setProfileData] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'auctions' | 'reviews'>('posts');

  useEffect(() => {
    if (user?.username) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data } = await userService.getProfile(user!.username);
      setProfileData(data.data);
      const postsRes = await userService.getUserPosts(user!.username);
      setPosts(postsRes.data.data || []);
    } catch {}
  };

  if (!profileData) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.username}>{user?.username}</Text>
        <TouchableOpacity onPress={() => router.push('/settings/')}>
          <Ionicons name="menu-outline" size={28} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      <ScrollView>
        <ProfileHeader user={profileData} isOwnProfile onEditProfile={() => {}} />
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, activeTab === 'posts' && styles.activeTab]} onPress={() => setActiveTab('posts')}>
            <Ionicons name="grid-outline" size={22} color={activeTab === 'posts' ? COLORS.text : COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'auctions' && styles.activeTab]} onPress={() => setActiveTab('auctions')}>
            <Ionicons name="hammer-outline" size={22} color={activeTab === 'auctions' ? COLORS.text : COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'reviews' && styles.activeTab]} onPress={() => setActiveTab('reviews')}>
            <Ionicons name="star-outline" size={22} color={activeTab === 'reviews' ? COLORS.text : COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
        <ProfileGrid items={posts} onPress={(item) => router.push(`/post/${item.id}`)} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  username: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.text },
  tabs: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: COLORS.border, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  tab: { flex: 1, alignItems: 'center', paddingVertical: SPACING.md },
  activeTab: { borderBottomWidth: 2, borderBottomColor: COLORS.text },
});
