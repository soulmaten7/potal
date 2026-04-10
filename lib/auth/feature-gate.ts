'use client';

/**
 * Feature gate hook — CW27 Sprint 5
 *
 * 스펙 결정 7 (HOMEPAGE_REDESIGN_SPEC.md 432~464):
 *   - Rate Limit 폐기, "가치 교환 기반" 로그인 게이트
 *   - 비로그인: 데모/코드 보기 무제한
 *   - 로그인 필요: 코드 복사, 조합 저장, 공유 URL 생성
 *
 * Usage:
 *   const { requireLogin, loginRequired, closeLoginRequired, featureLabel } = useFeatureGate();
 *
 *   const handleCopy = () => {
 *     if (!requireLogin('code copy')) return;
 *     // ... actual copy logic
 *   };
 */

import { useCallback, useState } from 'react';
import { useSupabase } from '@/app/context/SupabaseProvider';

export type GatedFeature =
  | 'code copy'
  | 'save combos'
  | 'share combos'
  | 'view saved combos';

export function useFeatureGate() {
  const { session } = useSupabase();
  const [loginRequired, setLoginRequired] = useState(false);
  const [featureLabel, setFeatureLabel] = useState<GatedFeature>('code copy');

  const requireLogin = useCallback(
    (feature: GatedFeature): boolean => {
      if (session?.access_token) return true;
      setFeatureLabel(feature);
      setLoginRequired(true);
      return false;
    },
    [session]
  );

  const closeLoginRequired = useCallback(() => setLoginRequired(false), []);

  return {
    requireLogin,
    loginRequired,
    closeLoginRequired,
    featureLabel,
    isLoggedIn: !!session?.access_token,
  };
}
