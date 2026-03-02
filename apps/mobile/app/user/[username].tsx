import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import ProfileHeader from '../../components/profile/ProfileHeader';
import ProfileGrid from '../../components/profile/ProfileGrid';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../stores/authStore';
import { COLORS } from '../../utils/constants';

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { user: currentUser } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    try {
      const { data } = await userService.getProfile(username);
      setProfile(data.data);
      setIsFollowing(data.data.isFollowing);
      const postsRes = await userService.getUserPosts(username);
      setPosts(postsRes.data.data || []);
    } catch {}
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await userService.unfollow(username);
        setIsFollowing(false);
      } else {
        await userService.follow(username);
        setIsFollowing(true);
      }
    } catch (e: any) {
      Alert.alert('오류', e.response?.data?.error?.message || '다시 시도해주세요');
    }
  };

  if (!profile) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.container}>
      <ProfileHeader
        user={profile}
        isOwnProfile={currentUser?.username === username}
        isFollowing={isFollowing}
        onFollow={handleFollow}
      />
      <ProfileGrid items={posts} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
});
