"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';
import { useSupabase } from '../context/SupabaseProvider';

// [1] 이메일 아이콘 (깔끔한 선)
function MailIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

// [2] 구글 아이콘 (공식 멀티컬러 G 로고)
function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.95-2.13 15.93-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.2 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
}

// [3] 페이스북 아이콘 (공식 f 로고)
function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

// [4] 애플 아이콘 (사과 로고)
function AppleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 384 512" fill="currentColor" {...props}>
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z" />
    </svg>
  );
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* 배경 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[480px] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* 닫기 버튼 */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors z-10"
        >
          {Icons.X ? <Icons.X className="w-5 h-5 text-slate-500" /> : <span className="text-slate-500 font-bold">✕</span>}
        </button>

        <div className="p-8 pt-10 text-center">
          <div className="mb-6 flex justify-center">
             <h2 className="text-3xl font-extrabold text-[#02122c] tracking-tight">POTAL</h2>
          </div>
          
          <h3 className="text-xl font-bold text-[#02122c] mb-2">
            Get the full experience
          </h3>
          <p className="text-slate-500 mb-8 text-sm leading-relaxed">
            Track prices, set your Zipcode, and enjoy faster AI searching.
          </p>

          <div className="space-y-3">
            {/* 1. 이메일 */}
            <button
              onClick={() => {
                onClose();
                router.push('/auth/login');
              }}
              className="w-full py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-[#02122c] font-bold rounded-xl flex items-center justify-center gap-3 transition-colors"
            >
               <MailIcon className="w-5 h-5" />
               <span>Continue with Email</span>
            </button>

            {/* 2. 구글 (테두리 추가 + 컬러 로고) */}
            <button 
              onClick={() => handleSocialLogin('google')}
              className="w-full py-3.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-[#02122c] font-bold rounded-xl flex items-center justify-center gap-3 transition-colors"
            >
               <GoogleIcon className="w-5 h-5" /> 
               <span>Continue with Google</span>
            </button>

            {/* 3. 페이스북 (파란 배경 + 하얀 로고) */}
            <button 
              onClick={() => handleSocialLogin('facebook')}
              className="w-full py-3.5 px-4 bg-[#1877F2] hover:bg-[#1864cc] text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-colors"
            >
               <FacebookIcon className="w-5 h-5 text-white" />
               <span>Continue with Facebook</span>
            </button>
             
             {/* 4. 애플 (검은 배경 + 하얀 로고) */}
             <button 
              onClick={() => handleSocialLogin('apple')}
              className="w-full py-3.5 px-4 bg-black hover:opacity-80 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-colors"
            >
               <AppleIcon className="w-5 h-5 text-white" />
               <span>Continue with Apple</span>
            </button>
          </div>

          <p className="mt-8 text-[11px] text-slate-400 leading-normal">
            By continuing, you agree to POTAL's <a href="/legal/terms" className="underline hover:text-slate-600">Terms of Service</a> and acknowledge that you have read our <a href="/legal/privacy" className="underline hover:text-slate-600">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}