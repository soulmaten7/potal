import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { COLORS, FONT_SIZES, SPACING, GRID_IMAGE_SIZE } from '../../utils/constants';
import { feedService } from '../../services/feedService';
import { formatPrice } from '../../utils/format';

const FILTERS = ['마감임박', '인기순', '최신순', '낮은가격', '높은가격'];
const SORT_MAP: Record<string, string> = { '마감임박': 'ending_soon', '인기순': 'popular', '최신순': 'newest', '낮은가격': 'price_low', '높은가격': 'price_high' };

export default function ExploreScreen() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('마감임박');
  const [auctions, setAuctions] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any>(null);

  useEffect(() => {
    loadAuctions();
  }, [filter]);

  const loadAuctions = async () => {
    try {
      const { data } = await feedService.getLocalFeed('서울', undefined, SORT_MAP[filter]);
      setAuctions(data.data || []);
    } catch {}
  };

  const handleSearch = async () => {
    if (!query.trim()) { setSearchResults(null); return; }
    try {
      const { data } = await feedService.search(query);
      setSearchResults(data.data);
    } catch {}
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} />
        <TextInput style={styles.searchInput} placeholder="검색" value={query} onChangeText={setQuery} onSubmitEditing={handleSearch} returnKeyType="search" />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={styles.filtersContent}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[styles.chip, filter === f && styles.activeChip]} onPress={() => { setFilter(f); setSearchResults(null); setQuery(''); }}>
            <Text style={[styles.chipText, filter === f && styles.activeChipText]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FlatList
        data={auctions}
        numColumns={3}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.gridItem} onPress={() => router.push(`/auction/${item.id}`)}>
            <Image source={item.images?.[0]?.imageUrl || 'https://via.placeholder.com/200'} style={styles.gridImage} contentFit="cover" />
            <View style={styles.priceOverlay}>
              <Text style={styles.priceText}>{formatPrice(item.currentPrice || item.startPrice)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFEFEF', borderRadius: 10, marginHorizontal: SPACING.lg, marginVertical: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: 8 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: FONT_SIZES.medium },
  filters: { maxHeight: 44, paddingHorizontal: SPACING.lg },
  filtersContent: { gap: 8, alignItems: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  activeChip: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  chipText: { fontSize: FONT_SIZES.small, color: COLORS.text },
  activeChipText: { color: COLORS.white },
  gridItem: { width: GRID_IMAGE_SIZE, height: GRID_IMAGE_SIZE, padding: 0.5 },
  gridImage: { width: '100%', height: '100%' },
  priceOverlay: { position: 'absolute', bottom: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 },
  priceText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },
});
