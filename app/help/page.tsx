"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Icons } from '@/components/icons';
// [중요] 방금 만든 컴포넌트 불러오기
import { ContactForm } from '@/components/help/ContactForm';

// --- FAQ DATA ---
const FAQ_CATEGORIES = [
  { id: 'all', label: 'All Topics' },
  { id: 'about', label: 'About POTAL' },
  { id: 'account', label: 'Account & Security' },
  { id: 'prices', label: 'Prices & Shipping' },
  { id: 'partners', label: 'Advertising & Partners' },
];

const FAQ_ITEMS = [
  {
    id: '1',
    category: 'about',
    question: 'What is POTAL?',
    answer: 'POTAL is an AI-powered search agent, not a retailer. We scan hundreds of global sites (Amazon, Walmart, AliExpress, etc.) to find you the best balance between price and shipping speed. We do not sell products directly; we connect you to the best deals.'
  },
  {
    id: '2',
    category: 'prices',
    question: 'How accurate are the shipping estimates?',
    answer: 'We analyze real-time logistics data based on your Zipcode. "Domestic" items usually arrive in 1-5 days, while "Global" items take 7-15 days. However, final delivery dates are confirmed by the retailer at checkout.'
  },
  {
    id: '3',
    category: 'partners',
    question: 'How do I advertise with POTAL?',
    answer: 'We offer various advertising placements for retailers and brands. Please fill out the form below with "Advertising Inquiry" selected.'
  },
  {
    id: '4',
    category: 'account',
    question: 'How do I sign out?',
    answer: 'Click your User Profile icon in the top right corner of the header and select "Sign Out".'
  },
  {
    id: '5',
    category: 'partners',
    question: 'Do you offer an API for developers?',
    answer: 'Yes, we have a search API available for enterprise partners. Contact us via the support form below for documentation.'
  }
];

// --- MAIN CONTENT ---
function HelpContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  
  // [Logic] URL 파라미터 감지 및 자동 스크롤
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLDivElement>(null);
  const [contactTopic, setContactTopic] = useState('general');

  useEffect(() => {
    const topicParam = searchParams.get('topic');
    
    if (topicParam) {
      // 1. 매핑
      switch(topicParam) {
        case 'sell': setContactTopic('partner'); break;
        case 'ads': setContactTopic('ads'); break;
        case 'general': setContactTopic('general'); break;
        default: setContactTopic('general');
      }
      // 2. 자동 스크롤
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [searchParams]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredItems = FAQ_ITEMS.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeTab === 'all' || item.category === activeTab;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full bg-white min-h-screen pb-20">
      
      {/* 1. Hero Search */}
      <div className="bg-[#f1f2f8] py-16 border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto px-6 flex flex-col items-center text-center">
          <h1 className="text-4xl font-extrabold text-[#02122c] mb-6 tracking-tight">
            How can we help you?
          </h1>
          <div className="relative w-full max-w-2xl">
            <input 
              type="text" 
              placeholder="Search for answers (e.g. shipping, advertising, refund)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-14 pl-12 pr-4 rounded-xl border border-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent text-lg"
            />
            <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
          </div>
        </div>
      </div>

      {/* 2. Category Pills */}
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {FAQ_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all border ${
                activeTab === cat.id 
                  ? 'bg-[#02122c] text-white border-[#02122c]' 
                  : 'bg-white text-slate-600 border-slate-200 hover:border-[#02122c] hover:text-[#02122c]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 3. Accordion List */}
        <div className="max-w-4xl mx-auto space-y-4">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const isOpen = openItems.has(item.id);
              return (
                <div key={item.id} className="border-b border-slate-200 last:border-0">
                  <button onClick={() => toggleItem(item.id)} className="w-full flex items-center justify-between py-6 text-left group">
                    <span className={`text-lg font-bold transition-colors ${isOpen ? 'text-[#F59E0B]' : 'text-[#02122c] group-hover:text-[#F59E0B]'}`}>
                      {item.question}
                    </span>
                    <Icons.ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#F59E0B]' : ''}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
                    <div className="text-slate-600 leading-relaxed text-[15px]">{item.answer}</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20">
              <p className="text-slate-500 text-lg">No results found for "{searchTerm}"</p>
              <button onClick={() => setSearchTerm('')} className="mt-4 text-[#F59E0B] font-bold hover:underline">Clear search</button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Embedded Contact Form Section (Ref for Auto-Scroll) */}
      <div ref={formRef} className="mt-20 pt-16 border-t border-slate-200 bg-[#f8f9fa]">
        <div className="max-w-[800px] mx-auto px-6 pb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-[#02122c] mb-4">Still need help?</h2>
            <p className="text-slate-600">
              Send us a message directly. We usually respond within 24 hours.
            </p>
          </div>
          
          {/* [Clean Code] 복잡한 폼 로직은 저쪽 파일로 위임 */}
          <ContactForm initialTopic={contactTopic} />
          
        </div>
      </div>
    </div>
  );
}

export default function HelpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <HelpContent />
    </Suspense>
  );
}