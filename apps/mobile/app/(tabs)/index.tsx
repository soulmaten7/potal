import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import FeedCard from '../../components/feed/FeedCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useFeed } from '../../hooks/useFeed';
import { useAuthStore } from '../../stores/authStore';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<'following' | 'local'>('following');
  const { followingFeed, localFeed, isLoading, loadMore, refresh, fetchLocalFeed } = useFeed();
  const user = useAuthStore((state) => state.user);
  const userCity = user?.city || '서울';

  useEffect(() => {
    if (activeTab === 'following') refresh();
    else fetchLocalFeed(userCity);
  }, [activeTab, userCity]);

  const data = activeTab === 'following' ? followingFeed : localFeed.map((a: any) => ({ type: 'auction', data: a }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.logo}>BidTable</Text>
        <TouchableOpacity onPress={() => router.push('/chat/')}>
          <Ionicons name="chatbubble-ellipses-outline" size={26} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'following' && styles.activeTab]} onPress={() => setActiveTab('following')}>
          <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>팔로잉</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'local' && styles.activeTab]} onPress={() => setActiveTab('local')}>
          <Text style={[styles.tabText, activeTab === 'local' && styles.activeTabText]}>내 주변</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={data}
        keyExtractor={(item: any, index) => item.data?.id || index.toString()}
        renderItem={({ item }) => <FeedCard item={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        onEndReached={activeTab === 'following' ? loadMore : undefined}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={!isLoading ? <EmptyState icon="newspaper-outline" title="피드가 비어있습니다" message="유저를 팔로우하면 피드가 채워집니다" /> : <LoadingSpinner />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  logo: { fontSize: FONT_SIZES.title, fontWeight: '700', color: COLORS.text },
  tabs: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  tab: { flex: 1, alignItems: 'center', paddingVertical: SPACING.md },
  activeTab: { borderBottomWidth: 2, borderBottomColor: COLORS.text },
  tabText: { fontSize: FONT_SIZES.medium, color: COLORS.textSecondary, fontWeight: '600' },
  activeTabText: { color: COLORS.text },
  separator: { height: 1, backgroundColor: COLORS.border },
});
