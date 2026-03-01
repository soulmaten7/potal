/**
 * native-auth.ts
 * Capacitor 네이티브 앱에서 OAuth를 SFSafariViewController(in-app browser)로 처리.
 * Apple App Store Guideline 4.0 준수 — 외부 브라우저로 나가지 않음.
 *
 * 흐름:
 * 1. signInWithOAuth({ skipBrowserRedirect: true }) → 인증 URL 획득
 * 2. Browser.open() → SFSafariViewController에서 Google 로그인
 * 3. Supabase가 potal://auth-callback#access_token=...&refresh_token=... 으로 리다이렉트
 * 4. @capacitor/app이 딥링크 캐치 → 토큰 파싱 → setSession()
 */

import { Capacitor } from "@capacitor/core";

/** 현재 네이티브 플랫폼(iOS/Android)에서 실행 중인지 확인 */
export function isNativePlatform(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/** 네이티브 앱용 OAuth 리다이렉트 URL (딥링크) */
export const NATIVE_AUTH_CALLBACK = "potal://auth-callback";

/**
 * 딥링크 URL에서 Supabase 세션 토큰을 파싱
 * URL fragment: #access_token=...&refresh_token=...&...
 */
export function parseAuthTokensFromUrl(url: string): {
  access_token: string;
  refresh_token: string;
} | null {
  try {
    // Fragment는 # 뒤에 있음
    const hashIndex = url.indexOf("#");
    if (hashIndex === -1) return null;

    const fragment = url.substring(hashIndex + 1);
    const params = new URLSearchParams(fragment);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (access_token && refresh_token) {
      return { access_token, refresh_token };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * SFSafariViewController로 OAuth 인증 시작
 * @returns 성공 시 true, 실패 시 false
 */
export async function startNativeOAuth(
  supabase: any,
  provider: "google"
): Promise<boolean> {
  try {
    // 동적 import — 웹에서는 로드하지 않음
    const { Browser } = await import("@capacitor/browser");

    // Supabase에서 인증 URL만 가져오기 (자동 리다이렉트 하지 않음)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: NATIVE_AUTH_CALLBACK,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data?.url) {
      console.error("Native OAuth URL generation failed:", error);
      return false;
    }

    // SFSafariViewController로 열기 (Apple이 요구하는 방식)
    await Browser.open({ url: data.url, presentationStyle: "popover" });
    return true;
  } catch (err) {
    console.error("startNativeOAuth error:", err);
    return false;
  }
}

/**
 * 딥링크 리스너 등록 — SupabaseProvider에서 한번만 호출
 * potal://auth-callback 딥링크를 캐치하여 세션 설정
 */
export async function setupDeepLinkListener(supabase: any): Promise<() => void> {
  if (!isNativePlatform()) {
    return () => {}; // 웹에서는 no-op
  }

  try {
    const { App: CapApp } = await import("@capacitor/app");
    const { Browser } = await import("@capacitor/browser");

    const listener = await CapApp.addListener("appUrlOpen", async (event) => {
      const url = event.url;

      // potal://auth-callback 딥링크인지 확인
      if (url.startsWith("potal://auth-callback")) {
        // SFSafariViewController 닫기
        try {
          await Browser.close();
        } catch {
          // 이미 닫혔을 수 있음
        }

        // 토큰 파싱
        const tokens = parseAuthTokensFromUrl(url);
        if (tokens) {
          const { error } = await supabase.auth.setSession({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
          });
          if (error) {
            console.error("setSession error:", error);
          }
        }
      }
    });

    // cleanup 함수 반환
    return () => {
      listener.remove();
    };
  } catch (err) {
    console.error("setupDeepLinkListener error:", err);
    return () => {};
  }
}
