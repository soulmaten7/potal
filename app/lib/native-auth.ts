/**
 * native-auth.ts
 * Capacitor 네이티브 앱 지원은 제거됨 (B2B 전환).
 * 기존 import를 유지하기 위한 stub 함수들.
 */

/** 항상 false — 네이티브 앱 미지원 */
export function isNativePlatform(): boolean {
  return false;
}

/** 네이티브 앱용 OAuth 리다이렉트 URL (미사용) */
export const NATIVE_AUTH_CALLBACK = "potal://auth-callback";

/** stub — 항상 null 반환 */
export function parseAuthTokensFromUrl(_url: string): {
  access_token: string;
  refresh_token: string;
} | null {
  return null;
}

/** stub — 항상 false 반환 */
export async function startNativeOAuth(
  _supabase: any,
  _provider: "google"
): Promise<boolean> {
  return false;
}

/** stub — no-op cleanup 반환 */
export async function setupDeepLinkListener(_supabase: any): Promise<() => void> {
  return () => {};
}
