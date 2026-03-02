export const MIN_START_PRICE = 30000;
export const BID_MIN_INCREMENT = 1000;

export const AUCTION_DURATIONS = {
  HOURS_24: 24 * 60 * 60 * 1000,
  HOURS_48: 48 * 60 * 60 * 1000,
  HOURS_72: 72 * 60 * 60 * 1000,
} as const;

export const AUCTION_DURATION_LABELS: Record<string, string> = {
  HOURS_24: '24시간',
  HOURS_48: '48시간',
  HOURS_72: '72시간',
};

export const MEAL_DURATIONS = {
  MIN_60: 60,
  MIN_90: 90,
  MIN_120: 120,
  MIN_150: 150,
  MIN_180: 180,
} as const;

export const MEAL_DURATION_LABELS: Record<string, string> = {
  MIN_60: '1시간',
  MIN_90: '1시간 30분',
  MIN_120: '2시간',
  MIN_150: '2시간 30분',
  MIN_180: '3시간',
};
