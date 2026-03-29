import { redirect } from 'next/navigation';

/**
 * B-1: /auth/join → /auth/signup 리다이렉트
 * 기존 B2C 가입 링크가 깨지지 않도록 유지.
 */
export default function JoinRedirectPage() {
  redirect('/auth/signup');
}
