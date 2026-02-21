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
    <div style={{ backgroundColor: '#02122c' }} className="w-full min-h-screen pb-28">

      {/* 1. Hero Search */}
      <div style={{ padding: '80px 24px 32px' }}>
        <div className="max-w-[1440px] mx-auto flex flex-col items-center text-center">
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', marginBottom: '20px', letterSpacing: '-0.02em' }}>
            How can we help you?
          </h1>
          <div className="relative w-full max-w-2xl">
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%', height: '48px', paddingLeft: '44px', paddingRight: '16px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#ffffff', fontSize: '15px', outline: 'none',
              }}
            />
            <Icons.Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: 'rgba(255,255,255,0.35)' }} />
          </div>
        </div>
      </div>

      {/* 2. Category Pills */}
      <div className="max-w-[1440px] mx-auto px-6 py-4">
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {FAQ_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              style={{
                padding: '6px 16px', borderRadius: '9999px', fontSize: '13px', fontWeight: 700,
                background: activeTab === cat.id ? '#F59E0B' : 'rgba(255,255,255,0.08)',
                color: activeTab === cat.id ? '#ffffff' : 'rgba(255,255,255,0.5)',
                border: activeTab === cat.id ? 'none' : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 3. Accordion List */}
        <div className="max-w-4xl mx-auto">
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            {filteredItems.length > 0 ? (
              filteredItems.map((item, idx) => {
                const isOpen = openItems.has(item.id);
                return (
                  <div key={item.id}>
                    {idx > 0 && <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 20px' }} />}
                    <button onClick={() => toggleItem(item.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: isOpen ? '#F59E0B' : '#ffffff', transition: 'color 0.2s', paddingRight: '12px' }}>
                        {item.question}
                      </span>
                      <Icons.ChevronDown style={{ width: '16px', height: '16px', color: isOpen ? '#F59E0B' : 'rgba(255,255,255,0.25)', transition: 'transform 0.3s', transform: isOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }} />
                    </button>
                    <div style={{ overflow: 'hidden', maxHeight: isOpen ? '500px' : '0', opacity: isOpen ? 1 : 0, transition: 'all 0.3s ease' }}>
                      <div style={{ padding: '0 20px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.7' }}>{item.answer}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>No results found for &ldquo;{searchTerm}&rdquo;</p>
                <button onClick={() => setSearchTerm('')} style={{ marginTop: '12px', fontSize: '13px', fontWeight: 700, color: '#F59E0B', background: 'transparent', border: 'none', cursor: 'pointer' }}>Clear search</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Embedded Contact Form Section */}
      <div ref={formRef} style={{ marginTop: '40px', padding: '32px 24px 0' }}>
        <div className="max-w-[800px] mx-auto">
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>Still need help?</h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
              Send us a message directly. We usually respond within 24 hours.
            </p>
          </div>

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