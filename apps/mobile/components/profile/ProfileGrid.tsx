import React from 'react';
import { FlatList, TouchableOpacity, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { GRID_IMAGE_SIZE } from '../../utils/constants';

interface ProfileGridProps {
  items: any[];
  onPress?: (item: any) => void;
}

export default function ProfileGrid({ items, onPress }: ProfileGridProps) {
  return (
    <FlatList
      data={items}
      numColumns={3}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const imageUrl = item.images?.[0]?.imageUrl || 'https://via.placeholder.com/200';
        return (
          <TouchableOpacity style={styles.item} onPress={() => onPress?.(item)}>
            <Image source={imageUrl} style={styles.image} contentFit="cover" />
          </TouchableOpacity>
        );
      }}
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  item: { width: GRID_IMAGE_SIZE, height: GRID_IMAGE_SIZE, padding: 0.5 },
  image: { width: '100%', height: '100%' },
});
