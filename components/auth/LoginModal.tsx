"use client";

import React, { useState } from 'react';
import { Icons } from '../icons';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // 로그인 성공 시 다음 단계(온보딩)로 넘기기 위함
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  if (!isOpen) return null;

  // [데모용] 실제 연동 전 UI 흐름 확인을 위한 가짜 로그인 함수
  const handleSocialLogin = (provider: string) => {
    console.log(`Logging in with ${provider}...`);
    // 실제로는 여기서 supabase.auth.signInWithOAuth() 호출
    setTimeout(() => {
      onSuccess(); // 1초 뒤 성공 처리하고 온보딩 모달로 전환
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-[480px] rounded-3xl p-8 shadow-2xl relative animate-scaleIn">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600">
          <Icons.X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-3xl font-black text-[#02122c] tracking-tighter mb-4 block">POTAL</span>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Get the full experience</h2>
          <p className="text-slate-500 text-sm">
            Track prices, set your Zipcode, and enjoy faster AI searching.
          </p>
        </div>

        {/* Buttons Stack */}
        <div className="space-y-3">
          <button onClick={() => handleSocialLogin('email')} className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
            Continue with Email
          </button>
          
          <button onClick={() => handleSocialLogin('google')} className="w-full py-3.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-3 transition-colors">
            {/* Google Icon SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <button onClick={() => handleSocialLogin('facebook')} className="w-full py-3.5 bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-colors">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Continue with Facebook
          </button>
          
          <button onClick={() => handleSocialLogin('apple')} className="w-full py-3.5 bg-black hover:bg-gray-800 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-colors">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.21-.93 3.69-.74 2.37.29 4.14 1.7 4.52 1.87-.22.14-2.88 1.62-2.88 4.96 0 3.83 3.32 5.09 3.32 5.09-.07.15-2.18 4.67-3.73 6.05zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            Continue with Apple
          </button>
        </div>

        {/* Footer Text */}
        <p className="mt-6 text-center text-[11px] text-gray-500 leading-relaxed px-4">
          By continuing, you agree to POTAL's <span className="underline cursor-pointer">Terms of Service</span> and acknowledge that you have read our <span className="underline cursor-pointer">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}