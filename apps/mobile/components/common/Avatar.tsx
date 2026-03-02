import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { COLORS } from '../../utils/constants';

interface AvatarProps {
  uri: string | null;
  size: number;
}

export default function Avatar({ uri, size }: AvatarProps) {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      <Image
        source={uri || 'https://via.placeholder.com/150?text=user'}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
        transition={200}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
});
