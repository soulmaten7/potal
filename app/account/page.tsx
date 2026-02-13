"use client";

import React, { useState, useEffect } from 'react';
import { Icons } from '@/components/icons';
// [핵심] 가짜 데이터 대신 진짜 로그인 정보를 가져옵니다.
import { useSupabase } from '../context/SupabaseProvider';

// 섹션 컴포넌트
const Section = ({ title, children, className = "" }: { title?: string, children: React.ReactNode, className?: string }) => (
  <div className={`mb-8 ${className}`}>
    {title && <h3 className="text-sm font-bold text-slate-900 mb-4">{title}</h3>}
    <div className="bg-white border border-[#e0e3eb] p-6 rounded-xl shadow-sm">
      {children}
    </div>
  </div>
);

// 휴지통 아이콘 (에러 방지용)
function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
  );
}

export default function AccountPage() {
  // [핵심] Supabase 세션 가져오기
  const { session, supabase } = useSupabase();

  // 상태 관리
  const [email, setEmail] = useState(''); 
  const [name, setName] = useState('Guest');
  
  // Zipcode 상태
  const [primaryZip, setPrimaryZip] = useState(''); 
  const [savedZips, setSavedZips] = useState<string[]>([]); 
  const [inputZip, setInputZip] = useState(''); 
  const [isSuccess, setIsSuccess] = useState(false); 

  // [데이터 로드] 1. 유저 정보 (Supabase) + 2. Zipcode (Local Storage)
  useEffect(() => {
    // 1. 실제 유저 정보 연동
    if (session?.user) {
      const userEmail = session.user.email || '';
      setEmail(userEmail);
      
      // 구글 로그인 등에서 가져온 메타데이터 이름, 없으면 이메일 앞부분 사용
      const metaName = session.user.user_metadata?.full_name || session.user.user_metadata?.name;
      const emailName = userEmail.split('@')[0];
      setName(metaName || emailName || 'POTAL User');
    } else {
      // 비로그인 상태일 때 처리 (필요시 리다이렉트 등)
      setName('Guest');
      setEmail('Please log in');
    }

    // 2. Zipcode 정보 로드 (기존 로직 유지)
    const active = localStorage.getItem('potal_zipcode') || '';
    try {
      const list = JSON.parse(localStorage.getItem('potal_zipcode_list') || '[]');
      setSavedZips(Array.isArray(list) ? list : []);
    } catch (e) {
      setSavedZips([]);
    }
    setPrimaryZip(active);
  }, [session]); // session이 로드되면 실행

  // [기능] 메인 우편번호 설정
  const setAsPrimary = (zip: string) => {
    setPrimaryZip(zip);
    localStorage.setItem('potal_zipcode', zip);
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 1500);
  };

  // [기능] 새 우편번호 추가
  const handleAddZipcode = () => {
    if (!inputZip.trim()) return;
    if (savedZips.includes(inputZip)) {
      alert("This zipcode is already in your list.");
      return;
    }
    const newList = [...savedZips, inputZip];
    setSavedZips(newList);
    localStorage.setItem('potal_zipcode_list', JSON.stringify(newList));
    if (!primaryZip) setAsPrimary(inputZip);
    setInputZip(''); 
  };

  // [기능] 우편번호 삭제
  const handleDeleteZip = (zipToDelete: string) => {
    const newList = savedZips.filter(z => z !== zipToDelete);
    setSavedZips(newList);
    localStorage.setItem('potal_zipcode_list', JSON.stringify(newList));
    if (primaryZip === zipToDelete) {
      setPrimaryZip('');
      localStorage.removeItem('potal_zipcode');
    }
  };

  // [기능] 로그아웃
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-[#f8fbff] pb-20">
      <main className="max-w-[1440px] mx-auto px-6 pt-10">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* [Left Sidebar] Profile & Navigation */}
          <aside className="w-full md:w-[320px] shrink-0">
            <div className="bg-white border border-[#e0e3eb] rounded-xl p-8 mb-6 shadow-sm text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-md">
                {/* 이름 첫 글자 표시 */}
                {name.charAt(0).toUpperCase()}
              </div>
              <h1 className="text-xl font-bold text-[#02122c] mb-1">{name}</h1>
              <p className="text-slate-500 text-sm font-medium break-all">{email}</p>
            </div>

            <nav className="space-y-2">
              <button className="w-full flex items-center justify-between p-4 bg-[#02122c] text-white rounded-xl shadow-md ring-2 ring-[#02122c] ring-offset-2">
                <div className="flex items-center gap-3 font-bold">
                  <Icons.User className="w-5 h-5" />
                  <span>Account</span>
                </div>
                <Icons.ChevronRight className="w-4 h-4 text-white/50" />
              </button>
            </nav>

            <div className="mt-6">
              <button 
                onClick={handleLogout}
                className="w-full py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors"
              >
                Log out
              </button>
            </div>
          </aside>

          {/* [Right Content] Settings Form */}
          <div className="flex-1 max-w-[800px]">
            <div className="mb-6 ml-1">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">Settings</span>
                <h2 className="text-3xl font-black text-[#02122c] tracking-tight">Account Preferences</h2>
            </div>

            {/* General Info - 실제 데이터 표시 */}
            <Section title="General info">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1 block">Email Address</label>
                  <p className="text-lg font-bold text-[#02122c]">{email}</p>
                </div>
                <div className="text-xs text-slate-400 font-medium px-3 py-1 bg-slate-100 rounded-full">
                  Managed by Google
                </div>
              </div>
            </Section>

            {/* Shipping Preferences (기존 기능 유지) */}
            <Section title="Shipping Preferences">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#02122c]">Primary Zipcode</h3>
                    <p className="text-slate-500 text-sm">
                      This location is automatically used for shipping estimates.
                    </p>
                  </div>
                </div>
                
                {/* 1. 현재 메인 배송지 */}
                <div className={`p-4 rounded-xl border-2 transition-all duration-500 flex items-center justify-between mb-8 ${isSuccess ? 'border-green-500 bg-green-50' : 'border-[#02122c] bg-white'}`}>
                   <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSuccess ? 'bg-green-500 text-white' : 'bg-[#02122c] text-white'}`}>
                        <Icons.MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Active Location</span>
                        <span className="text-xl font-black text-[#02122c] font-mono">
                          {primaryZip || "Not set"}
                        </span>
                      </div>
                   </div>
                   {isSuccess && <span className="text-green-600 font-bold text-sm animate-pulse">Saved!</span>}
                </div>

                {/* 2. 새 우편번호 추가 */}
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Add New Location</label>
                <div className="flex gap-2 mb-6">
                   <input 
                     type="text" 
                     placeholder="e.g. 10001" 
                     value={inputZip}
                     onChange={(e) => setInputZip(e.target.value)}
                     className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:border-[#02122c] focus:ring-1 focus:ring-[#02122c] transition-all font-mono font-bold text-[#02122c]"
                   />
                   <button 
                     onClick={handleAddZipcode}
                     disabled={!inputZip}
                     className="px-6 py-3 bg-slate-200 hover:bg-[#02122c] hover:text-white text-slate-800 font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     Add
                   </button>
                </div>

                {/* 3. 리스트 */}
                {savedZips.length > 0 && (
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Saved Locations</label>
                    <div className="space-y-2">
                      {savedZips.map((zip) => (
                        <div key={zip} className={`flex items-center justify-between p-3 rounded-lg border ${primaryZip === zip ? 'bg-slate-50 border-slate-300' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-[#02122c] text-lg">{zip}</span>
                            {primaryZip === zip && <span className="bg-[#02122c] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Active</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            {primaryZip !== zip && (
                              <button onClick={() => setAsPrimary(zip)} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-md transition-colors">
                                Set as Primary
                              </button>
                            )}
                            <button onClick={() => handleDeleteZip(zip)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </Section>

            {/* Subscriptions */}
            <Section title="Subscriptions">
              <div className="flex items-start gap-4">
                <div className="pt-1">
                  <input type="checkbox" id="subs" className="w-5 h-5 rounded border-gray-300 text-[#02122c] focus:ring-[#02122c]" defaultChecked />
                </div>
                <div>
                  <label htmlFor="subs" className="text-[#02122c] font-bold block mb-1 cursor-pointer">
                    Marketing emails
                  </label>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    I'd like to get the latest deals, news and inspiration sent straight to my inbox.
                  </p>
                </div>
              </div>
            </Section>

            {/* Delete Account */}
            <div className="mt-12 pt-8 border-t border-slate-200">
               <button className="text-sm font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1">
                 Delete account <Icons.ChevronRight className="w-3 h-3" />
               </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}