import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';

interface Props { size?: number }

export default function VerificationBadge({ size = 14 }: Props) {
  return <Ionicons name="checkmark-circle" size={size} color={COLORS.verified} />;
}
