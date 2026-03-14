"use client";

import React, { useState, useCallback, createContext, useContext } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const colors: Record<ToastType, { bg: string; border: string; text: string }> = {
    success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' },
    error: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
    info: { bg: '#f0f9ff', border: '#bae6fd', text: '#0284c7' },
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast container */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const c = colors[t.type];
          return (
            <div
              key={t.id}
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
                color: c.text,
                padding: '12px 20px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                pointerEvents: 'auto',
                animation: 'slideUp 0.3s ease-out',
                maxWidth: 360,
              }}
            >
              {t.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
