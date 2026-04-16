"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Icons } from '@/components/icons';
import { ContactForm } from '@/components/help/ContactForm';
import { useI18n } from '@/app/i18n';
import type { TranslationKey } from '@/app/i18n/translations/en';

function HelpContent() {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const searchParams = useSearchParams();
  const formRef = useRef<HTMLDivElement>(null);
  const [contactTopic, setContactTopic] = useState('general');

  const FAQ_CATEGORIES = [
    { id: 'all', label: t('help.category.all') },
    { id: 'about', label: t('help.category.about') },
    { id: 'account', label: t('help.category.account') },
    { id: 'pricing', label: t('help.category.pricing') },
    { id: 'shopify', label: t('help.category.shopify') },
    { id: 'plugins', label: t('help.category.plugins') },
  ];

  const FAQ_ITEMS = [
    { id: '1', category: 'about', question: t('help.faq.q1'), answer: t('help.faq.a1') },
    { id: '2', category: 'about', question: t('help.faq.q2'), answer: t('help.faq.a2') },
    { id: '3', category: 'shopify', question: t('help.faq.q3'), answer: t('help.faq.a3') },
    { id: '4', category: 'account', question: t('help.faq.q4'), answer: t('help.faq.a4') },
    { id: '5', category: 'pricing', question: t('help.faq.q5'), answer: t('help.faq.a5') },
    { id: '6', category: 'pricing', question: t('help.faq.q6'), answer: t('help.faq.a6') },
    { id: '7', category: 'shopify', question: t('help.faq.q7'), answer: t('help.faq.a7') },
    { id: '8', category: 'about', question: t('help.faq.q8'), answer: t('help.faq.a8') },
    { id: '9', category: 'plugins', question: t('help.faq.q9'), answer: t('help.faq.a9') },
    { id: '10', category: 'about', question: t('help.faq.q10'), answer: t('help.faq.a10') },
    { id: '11', category: 'pricing', question: t('help.faq.q11'), answer: t('help.faq.a11') },
    { id: '12', category: 'account', question: t('help.faq.q12'), answer: t('help.faq.a12') },
    { id: '13', category: 'plugins', question: t('help.faq.q13'), answer: t('help.faq.a13') },
  ];

  useEffect(() => {
    const topicParam = searchParams.get('topic');

    if (topicParam) {
      switch(topicParam) {
        case 'sell': setContactTopic('partner'); break;
        case 'ads': setContactTopic('ads'); break;
        case 'general': setContactTopic('general'); break;
        default: setContactTopic('general');
      }
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
            {t('help.title')}
          </h1>
          <div className="relative w-full max-w-2xl">
            <input
              type="text"
              placeholder={t('help.searchPlaceholder')}
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
        <div className="max-w-7xl mx-auto">
          <div style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {filteredItems.length > 0 ? (
              filteredItems.map((item, idx) => {
                const isOpen = openItems.has(item.id);
                return (
                  <div key={item.id}>
                    {idx > 0 && <div style={{ height: '1px', background: '#e2e8f0', margin: '0 20px' }} />}
                    <button onClick={() => toggleItem(item.id)} aria-expanded={isOpen} aria-controls={`faq-answer-${item.id}`} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: isOpen ? '#F59E0B' : '#02122c', transition: 'color 0.2s', paddingRight: '12px' }}>
                        {item.question}
                      </span>
                      <Icons.ChevronDown aria-hidden="true" style={{ width: '16px', height: '16px', color: isOpen ? '#F59E0B' : '#94a3b8', transition: 'transform 0.3s', transform: isOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }} />
                    </button>
                    <div id={`faq-answer-${item.id}`} role="region" aria-labelledby={`faq-q-${item.id}`} style={{ overflow: 'hidden', maxHeight: isOpen ? '500px' : '0', opacity: isOpen ? 1 : 0, transition: 'all 0.3s ease' }}>
                      <div style={{ padding: '0 20px 16px', fontSize: '13px', color: '#64748b', lineHeight: '1.7' }}>{item.answer}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ fontSize: '14px', color: '#94a3b8' }}>{t('help.noResults')} &ldquo;{searchTerm}&rdquo;</p>
                <button onClick={() => setSearchTerm('')} style={{ marginTop: '12px', fontSize: '13px', fontWeight: 700, color: '#F59E0B', background: 'transparent', border: 'none', cursor: 'pointer' }}>{t('help.clearSearch')}</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Embedded Contact Form Section */}
      <div ref={formRef} style={{ marginTop: '40px', padding: '32px 24px 0' }}>
        <div className="max-w-7xl mx-auto">
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#02122c', marginBottom: '8px' }}>{t('help.contactTitle')}</h2>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>
              {t('help.contactSubtitle')}
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
