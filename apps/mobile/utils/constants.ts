import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const COLORS = {
  background: '#FFFFFF',
  text: '#262626',
  textSecondary: '#8E8E8E',
  border: '#DBDBDB',
  primary: '#0095F6',
  like: '#ED4956',
  verified: '#0095F6',
  auctionLive: '#FF0000',
  auctionBg: '#FFF3F3',
  star: '#FFD700',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
};

export const FONT_SIZES = {
  xs: 10,
  small: 12,
  medium: 14,
  large: 16,
  xl: 20,
  xxl: 24,
  title: 28,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const PROFILE_IMAGE_SIZE = {
  tiny: 24,
  small: 32,
  medium: 44,
  large: 77,
  xlarge: 150,
};

export const GRID_IMAGE_SIZE = (SCREEN_WIDTH - 2) / 3;

export const API_BASE_URL = __DEV__ ? 'http://localhost:3000/v1' : 'https://api.bidtable.app/v1';
export const SOCKET_URL = __DEV__ ? 'http://localhost:3000' : 'https://api.bidtable.app';

export { SCREEN_WIDTH };
