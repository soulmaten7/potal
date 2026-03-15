'use client';

import { useState, useEffect, useCallback } from 'react';

interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="api-key"]',
    title: 'Your API Key',
    content: 'Copy your API key to start making requests. Keep it secure and never share it publicly.',
  },
  {
    target: '[data-tour="calculator"]',
    title: 'Landed Cost Calculator',
    content: 'Calculate the total landed cost for any product shipped to 240+ countries.',
  },
  {
    target: '[data-tour="usage"]',
    title: 'Usage Dashboard',
    content: 'Monitor your API usage, remaining quota, and plan limits in real time.',
  },
  {
    target: '[data-tour="integrations"]',
    title: 'Integrations',
    content: 'Connect your Shopify, WooCommerce, or other platforms for automated calculations.',
  },
  {
    target: '[data-tour="docs"]',
    title: 'Documentation',
    content: 'Explore our API docs, SDKs, and guides to build your integration.',
  },
];

const TOUR_KEY = 'potal_tour_completed';

export default function ProductTour() {
  const [step, setStep] = useState(-1);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  const isActive = step >= 0 && step < TOUR_STEPS.length;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const completed = localStorage.getItem(TOUR_KEY);
    if (!completed) {
      const timer = setTimeout(() => setStep(0), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const updatePosition = useCallback(() => {
    if (!isActive) return;
    const el = document.querySelector(TOUR_STEPS[step].target);
    if (el) {
      const rect = el.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });
    }
  }, [step, isActive]);

  useEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [updatePosition]);

  function finish() {
    setStep(-1);
    localStorage.setItem(TOUR_KEY, 'true');
  }

  function next() {
    if (step + 1 >= TOUR_STEPS.length) {
      finish();
    } else {
      setStep(step + 1);
    }
  }

  function skip() {
    finish();
  }

  if (!isActive) return null;

  const current = TOUR_STEPS[step];
  const tooltipTop = position.top + position.height + 12;
  const tooltipLeft = Math.max(16, position.left);

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9998] bg-black/40" onClick={skip} />

      {/* Spotlight */}
      <div
        className="fixed z-[9999] rounded-lg ring-4 ring-blue-500 ring-offset-2 pointer-events-none"
        style={{
          position: 'absolute',
          top: position.top - 4,
          left: position.left - 4,
          width: position.width + 8,
          height: position.height + 8,
        }}
      />

      {/* Tooltip */}
      <div
        className="absolute z-[10000] bg-white rounded-xl shadow-2xl p-5 max-w-xs"
        style={{ top: tooltipTop, left: tooltipLeft }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">{current.title}</h3>
          <span className="text-xs text-gray-400">{step + 1}/{TOUR_STEPS.length}</span>
        </div>
        <p className="text-sm text-gray-600 mb-4">{current.content}</p>
        <div className="flex items-center justify-between">
          <button onClick={skip} className="text-sm text-gray-400 hover:text-gray-600">
            Skip tour
          </button>
          <button
            onClick={next}
            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            {step + 1 === TOUR_STEPS.length ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </>
  );
}
