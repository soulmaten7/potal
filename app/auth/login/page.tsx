"use client";

import React from 'react';
import Link from 'next/link';
// [중복 제거 완료] Footer 임포트 삭제됨

export default function LoginPage() {
  return (
    // [FIX] Layout의 헤더/푸터 사이 공간을 꽉 채우면서(flex-grow), 배경색은 Dark Navy 유지
    <div className="w-full flex-grow flex flex-col justify-center items-center bg-[#02122c] py-20">
      
      {/* Login Card */}
      <div className="w-full max-w-[400px] bg-[#0a192f] border border-gray-800 rounded-3xl p-8 shadow-2xl">
        {/* Logo & Header */}
        <div className="text-center mb-10">
          <Link href="/" className="text-4xl font-black text-white tracking-tighter mb-4 inline-block">
            POTAL
          </Link>
          <p className="text-gray-400 text-sm mt-2">
            AI 에이전트와 함께 스마트한 직구를 시작하세요.
          </p>
        </div>

        {/* Login Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">EMAIL</label>
            <input 
              type="email" 
              placeholder="name@company.com"
              className="w-full bg-[#02122c] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F59E0B] transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">PASSWORD</label>
            <input 
              type="password" 
              placeholder="••••••••"
              className="w-full bg-[#02122c] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F59E0B] transition-all"
            />
          </div>
          
          <button className="w-full bg-[#F59E0B] text-[#02122c] font-black py-4 rounded-xl hover:bg-amber-400 transition-all mt-4 shadow-lg shadow-amber-500/10">
            SIGN IN
          </button>
        </div>

        {/* Social Dividier */}
        <div className="flex items-center my-8">
          <div className="flex-1 h-[1px] bg-gray-800"></div>
          <span className="px-4 text-xs text-gray-600 font-bold">OR</span>
          <div className="flex-1 h-[1px] bg-gray-800"></div>
        </div>

        {/* Social Login (Mockup) */}
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 bg-white text-black py-3 rounded-xl font-bold text-xs hover:bg-gray-100 transition-all">
            <span>Google</span>
          </button>
          <button className="flex items-center justify-center gap-2 bg-[#1877F2] text-white py-3 rounded-xl font-bold text-xs hover:bg-[#166fe5] transition-all">
            <span>Facebook</span>
          </button>
        </div>

        {/* Footer Links */}
        <div className="mt-10 text-center space-y-2">
          <p className="text-gray-500 text-xs">
            아직 계정이 없으신가요? <Link href="/auth/join" className="text-[#F59E0B] font-bold hover:underline">회원가입</Link>
          </p>
          <Link href="#" className="block text-gray-600 text-[10px] hover:text-gray-400">
            비밀번호를 잊으셨나요?
          </Link>
        </div>
      </div>

      {/* Trust Message */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 text-[11px] leading-relaxed max-w-[300px]">
          로그인 시 POTAL의 이용약관 및 개인정보 처리방침에 동의하게 되며, AI 에이전트가 최적의 상품을 추천하기 위해 데이터를 활용합니다.
        </p>
      </div>

      {/* [중복 제거 완료] <Footer /> 삭제됨 */}
    </div>
  );
}