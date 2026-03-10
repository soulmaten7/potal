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
  { id: 'account', label: 'Account & API' },
  { id: 'pricing', label: 'Pricing & Plans' },
  { id: 'shopify', label: 'Shopify App' },
];

const FAQ_ITEMS = [
  {
    id: '1',
    category: 'about',
    question: 'What is POTAL?',
    answer: 'POTAL is a Total Landed Cost API and Shopify app. We help e-commerce sellers calculate and display import duties, taxes, and fees for international orders — covering 240 countries with AI-powered HS Code classification.'
  },
  {
    id: '2',
    category: 'about',
    question: 'How accurate are the duty calculations?',
    answer: 'Our calculations are based on official tariff schedules, trade agreements (FTAs), and de minimis thresholds. While we provide highly accurate estimates, actual customs charges may vary based on the destination country\'s customs authority assessment. We recommend consulting a licensed customs broker for binding classifications.'
  },
  {
    id: '3',
    category: 'shopify',
    question: 'How do I install the POTAL Shopify app?',
    answer: 'Search for "POTAL" in the Shopify App Store, click Install, and approve the required permissions (read_products, read_orders, read_shipping). The widget will automatically appear on your product pages via the theme app extension.'
  },
  {
    id: '4',
    category: 'account',
    question: 'How do I get my API key?',
    answer: 'Sign up at potal.app, then go to your Dashboard. Your API keys are generated automatically. You can manage and rotate keys from the Dashboard at any time.'
  },
  {
    id: '5',
    category: 'pricing',
    question: 'What happens if I exceed my plan\'s API call limit?',
    answer: 'On the Free plan, API calls stop at the 100-call limit. On paid plans (Basic, Pro, Enterprise), overage calls are automatically billed: Basic $0.015/call, Pro $0.012/call, Enterprise $0.01/call. Enterprise customers with 100K+ volume commitments get $0.008/call. You can upgrade your plan anytime from the Dashboard.'
  },
  {
    id: '6',
    category: 'pricing',
    question: 'Is there a free plan?',
    answer: 'Yes! Our Free plan includes 100 API calls per month — no credit card required. Paid plans (Basic, Pro, Enterprise) come with a 14-day free trial. A payment method is collected at signup, but you won\'t be charged until the trial ends.'
  },
  {
    id: '7',
    category: 'shopify',
    question: 'What data does the Shopify app access?',
    answer: 'The app only accesses read_products (to classify items), read_orders (to track calculation usage), and read_shipping (to include shipping in landed cost). We never modify your store data.'
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
    <div style={{ backgroundColor: '#ffffff' }} className="w-full min-h-screen pb-28">

      {/* 1. Hero Search */}
      <div style={{ padding: '80px 24px 32px' }}>
        <div className="max-w-[1440px] mx-auto flex flex-col items-center text-center">
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#02122c', marginBottom: '20px', letterSpacing: '-0.02em' }}>
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
                background: '#f1f5f9', border: '1px solid #e2e8f0',
                color: '#02122c', fontSize: '15px', outline: 'none',
              }}
            />
            <Icons.Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#94a3b8' }} />
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
                background: activeTab === cat.id ? '#F59E0B' : '#f1f5f9',
                color: activeTab === cat.id ? '#ffffff' : '#64748b',
                border: activeTab === cat.id ? 'none' : '1px solid #e2e8f0',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 3. Accordion List */}
        <div className="max-w-4xl mx-auto">
          <div style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {filteredItems.length > 0 ? (
              filteredItems.map((item, idx) => {
                const isOpen = openItems.has(item.id);
                return (
                  <div key={item.id}>
                    {idx > 0 && <div style={{ height: '1px', background: '#e2e8f0', margin: '0 20px' }} />}
                    <button onClick={() => toggleItem(item.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: isOpen ? '#F59E0B' : '#02122c', transition: 'color 0.2s', paddingRight: '12px' }}>
                        {item.question}
                      </span>
                      <Icons.ChevronDown style={{ width: '16px', height: '16px', color: isOpen ? '#F59E0B' : '#94a3b8', transition: 'transform 0.3s', transform: isOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }} />
                    </button>
                    <div style={{ overflow: 'hidden', maxHeight: isOpen ? '500px' : '0', opacity: isOpen ? 1 : 0, transition: 'all 0.3s ease' }}>
                      <div style={{ padding: '0 20px 16px', fontSize: '13px', color: '#64748b', lineHeight: '1.7' }}>{item.answer}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ fontSize: '14px', color: '#94a3b8' }}>No results found for &ldquo;{searchTerm}&rdquo;</p>
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
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#02122c', marginBottom: '8px' }}>Still need help?</h2>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>
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