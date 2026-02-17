"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';
import { LoginModal } from '@/app/components/LoginModal'; 

// ==================================================================================
// 🔒 [DATA SECTION]
// ==================================================================================

const EXPLORE_DATA = [
  { title: "Electronics", keywords: ["Laptops", "Phones", "Tablets", "Audio", "Cameras"] },
  { title: "Fashion", keywords: ["Men's Clothing", "Women's Clothing", "Shoes", "Watches", "Bags"] },
  { title: "Home & Garden", keywords: ["Furniture", "Kitchen", "Decor", "Lighting", "Tools"] },
  { title: "Sports", keywords: ["Fitness", "Cycling", "Camping", "Fishing", "Running"] },
  { title: "Toys & Hobbies", keywords: ["Lego", "Drones", "Action Figures", "Board Games", "Puzzles"] },
  { title: "Motors", keywords: ["Car Accessories", "Motorcycle Parts", "Tools", "Electronics"] },
  { title: "Health & Beauty", keywords: ["Skincare", "Makeup", "Vitamins", "Hair Care", "Fragrance"] }
];

const COMPANY_LINKS = [
  { label: "About POTAL", href: "/about" },
  { label: "Sustainability", href: "/about#sustainability" },
  { label: "Contact Us", href: "/help?topic=general" },
];

const PARTNER_LINKS = [
  { label: "Affiliate Disclosure", href: "/partners" },
  { label: "Sell on POTAL", href: "/help?topic=sell" },
  { label: "Advertise with us", href: "/help?topic=ads" },
];

const INTERNATIONAL_SITES = [
  { label: "(US) USA", code: "US" },
  { label: "(KR) South Korea", code: "KR" },
  { label: "(UK) United Kingdom", code: "UK" },
  { label: "(JP) Japan", code: "JP" },
  { label: "(DE) Germany", code: "DE" },
  { label: "(FR) France", code: "FR" },
  { label: "(CN) China", code: "CN" },
  { label: "(CA) Canada", code: "CA" },
  { label: "(AU) Australia", code: "AU" }
];

// ==================================================================================
// 🔒 [COMPONENT SECTION]
// ==================================================================================

function MainAccordion({ title, children }: { title: string, children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
     <div className="w-full mb-1"> 
        <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between py-2 group cursor-pointer">
           <span className={`text-[15px] font-extrabold transition-colors text-left ${isOpen ? 'text-[#F59E0B]' : 'text-white group-hover:text-[#F59E0B]'}`}>
             {title}
           </span>
           <Icons.ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180 text-[#F59E0B]" : "text-white/50"}`} />
        </button>
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[1000px] opacity-100 pb-2" : "max-h-0 opacity-0"}`}>
           {children}
        </div>
     </div>
  )
}

function SubAccordion({ title, children }: { title: string, children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
     <div className="w-full ml-1 mb-1">
        <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between py-2 group cursor-pointer">
           <span className={`text-[13px] font-bold transition-colors text-left ${isOpen ? 'text-[#F59E0B]' : 'text-slate-400 group-hover:text-white'}`}>
             {title}
           </span>
           <Icons.ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isOpen ? "rotate-180 text-[#F59E0B]" : "text-slate-500"}`} />
        </button>
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[300px] opacity-100 pb-2" : "max-h-0 opacity-0"}`}>
           {children}
        </div>
     </div>
  )
}

const StaticLink = ({ href, children, onClick }: { href?: string, children: React.ReactNode, onClick?: () => void }) => {
    const baseClass = "text-[15px] font-extrabold text-white hover:text-[#F59E0B] transition-colors cursor-pointer block py-2"; 
    if (onClick) return <button onClick={onClick} className={`${baseClass} text-left w-full`}>{children}</button>;
    return <Link href={href || "#"} className={baseClass}>{children}</Link>;
};

export function Footer() {
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  
  // [추가] 통화 설정을 위한 상태
  const [currency, setCurrency] = useState('USD');
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const currencyRef = useRef<HTMLDivElement>(null);

  // 초기 로드 시 저장된 통화 확인
  useEffect(() => {
    const saved = localStorage.getItem('user_currency');
    if (saved) setCurrency(saved);
  }, []);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
        setShowCurrencyMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCurrencyChange = (newCurrency: 'USD' | 'KRW') => {
    setCurrency(newCurrency);
    localStorage.setItem('user_currency', newCurrency);
    setShowCurrencyMenu(false);
    
    // 변경 사항 반영을 위해 페이지 새로고침 (헤더와 동기화)
    window.location.reload();
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  return (
    <footer className="bg-[#02122c] text-white py-10 mt-auto w-full z-10 relative">
      
      {toastMsg && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#F59E0B] text-[#02122c] px-6 py-3 rounded-full font-bold shadow-xl z-50 animate-bounce">
          {toastMsg}
        </div>
      )}

      <div className="max-w-[1440px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12 items-start">
          
          <div className="flex flex-col items-start gap-4 pt-1"> 
            <Link href="/" className="text-3xl font-extrabold text-white tracking-tight cursor-pointer">POTAL</Link>
            
            {/* [업그레이드] 통화 변경 버튼 (위로 열리는 드롭다운) */}
            <div className="relative" ref={currencyRef}>
              <button 
                onClick={() => setShowCurrencyMenu(!showCurrencyMenu)} 
                className="flex items-center gap-2 hover:bg-white/10 font-bold text-[13px] border border-white/30 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                <Icons.Globe className="w-3.5 h-3.5" /> 
                {currency === 'USD' ? 'US · en-US · $ USD' : 'KR · ko-KR · ₩ KRW'}
              </button>

              {/* 드롭다운 메뉴 (위쪽으로 열림: bottom-full mb-2) */}
              {showCurrencyMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                   <div className="px-4 py-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                     Select Currency
                   </div>
                   <button 
                     onClick={() => handleCurrencyChange('USD')}
                     className={`w-full text-left px-4 py-3 text-sm font-bold flex items-center justify-between hover:bg-slate-50 ${currency === 'USD' ? 'text-[#02122c] bg-slate-50' : 'text-slate-500'}`}
                   >
                     <span>🇺🇸 USD ($)</span>
                     {currency === 'USD' && <Icons.Check className="w-4 h-4 text-[#02122c]" />}
                   </button>
                   <div className="w-full text-left px-4 py-3 text-sm font-bold flex items-center justify-between text-slate-300 cursor-not-allowed">
                     <span>🇰🇷 KRW (₩)</span>
                     <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Soon</span>
                   </div>
                </div>
              )}
            </div>

          </div>

          <div className="flex flex-col w-full">
            <StaticLink href="/help">Help Center</StaticLink>
            <StaticLink href="/legal/privacy-settings">Privacy Settings</StaticLink>
            <StaticLink onClick={() => setShowLoginModal(true)}>Log in</StaticLink>
          </div>

          <div className="flex flex-col w-full">
            <StaticLink href="/legal/terms">Terms of Service</StaticLink>
            <StaticLink href="/legal/privacy">Privacy Policy</StaticLink>
            <StaticLink href="/legal/cookie">Cookie Policy</StaticLink>
          </div>

          <div className="flex flex-col w-full">
            <MainAccordion title="Explore">
                <div className="flex flex-col pl-2">
                    {EXPLORE_DATA.map((item) => (
                    <SubAccordion key={item.title} title={item.title}>
                        <ul className="grid grid-cols-2 gap-2 pl-2">
                            {item.keywords.map(kw => (
                            <li key={kw}>
                                <Link href={`/search?q=${encodeURIComponent(kw)}`} className="text-[13px] text-slate-400 hover:text-white hover:underline transition-colors block cursor-pointer py-1">
                                {kw}
                                </Link>
                            </li>
                            ))}
                        </ul>
                    </SubAccordion>
                    ))}
                </div>
            </MainAccordion>

            <MainAccordion title="Company">
                <ul className="flex flex-col gap-1 pl-2">
                    {COMPANY_LINKS.map((item) => (
                    <li key={item.label}>
                        <Link href={item.href} className="text-[13px] text-slate-400 hover:text-white hover:underline transition-colors block cursor-pointer py-1">
                        {item.label}
                        </Link>
                    </li>
                    ))}
                </ul>
            </MainAccordion>

            <MainAccordion title="Partners">
                <ul className="flex flex-col gap-1 pl-2">
                    {PARTNER_LINKS.map((item) => (
                    <li key={item.label}>
                        <Link href={item.href} className="text-[13px] text-slate-400 hover:text-white hover:underline transition-colors block cursor-pointer py-1">
                        {item.label}
                        </Link>
                    </li>
                    ))}
                </ul>
            </MainAccordion>

            <MainAccordion title="International Sites">
                <div className="grid grid-cols-2 gap-2 pl-2">
                  {INTERNATIONAL_SITES.map((site) => (
                    <button key={site.code} onClick={() => showToast(`POTAL ${site.label} is coming soon! 🚀`)} className={`text-[13px] text-left px-2 py-1 rounded transition-colors ${site.code === 'US' ? 'text-[#F59E0B] font-bold cursor-default' : 'text-slate-500 hover:text-white cursor-pointer'}`}>
                      {site.label}
                    </button>
                  ))}
                </div>
             </MainAccordion>
          </div>
        </div>

        <div className="mt-10 text-center pt-8 opacity-40">
           <div className="text-[11px] text-white font-bold">
              &copy; 2026 POTAL Inc. All rights reserved. <br/>
              <span className="font-normal">POTAL is a global shopping search engine. We do not sell products directly.</span>
           </div>
        </div>
      </div>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onSuccess={() => setShowLoginModal(false)} /> 
    </footer>
  );
}