import React, { useState, useRef } from 'react';
import { FlatList, View, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Image } from 'expo-image';
import { COLORS, SCREEN_WIDTH } from '../../utils/constants';

interface ImageCarouselProps {
  images: { imageUrl: string }[];
  onDoubleTap?: () => void;
}

export default function ImageCarousel({ images, onDoubleTap }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const lastTapRef = useRef(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  const handlePress = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      onDoubleTap?.();
    }
    lastTapRef.current = now;
  };

  return (
    <View>
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={styles.imageContainer} onTouchEnd={handlePress}>
            <Image source={item.imageUrl} style={styles.image} contentFit="cover" transition={200} />
          </View>
        )}
      />
      {images.length > 1 && (
        <View style={styles.dots}>
          {images.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.activeDot]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: { width: SCREEN_WIDTH, aspectRatio: 1 },
  image: { width: '100%', height: '100%' },
  dots: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 8, gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.border },
  activeDot: { backgroundColor: COLORS.primary },
});
