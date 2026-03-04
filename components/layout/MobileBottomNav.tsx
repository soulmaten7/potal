"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/icons';

export function MobileBottomNav() {
  const pathname = usePathname();

  const tabs = [
    { id: 'home', label: 'Home', icon: Icons.Globe, href: '/' },
    { id: 'developers', label: 'Docs', icon: Icons.Box, href: '/developers' },
    { id: 'dashboard', label: 'Dashboard', icon: Icons.Shield, href: '/dashboard' },
    { id: 'pricing', label: 'Pricing', icon: Icons.Coins, href: '/pricing' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href) || false;
  };

  return (
    <div
      className="md:hidden fixed left-0 right-0 z-[9000]"
      style={{ bottom: '16px', padding: '0 16px' }}
    >
      <nav
        style={{
          background: '#ffffff',
          borderRadius: '9999px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          border: '1px solid #e2e8f0',
        }}
      >
        <div className="flex items-center justify-around" style={{ height: '58px', padding: '0 24px' }}>
          {tabs.map((tab) => {
            const active = isActive(tab.href);
            const IconComponent = tab.icon;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: active ? '6px 18px' : '6px 16px',
                  borderRadius: active ? '9999px' : '0',
                  background: active ? 'rgba(2,18,44,0.08)' : 'transparent',
                  transition: 'all 0.2s ease',
                  textDecoration: 'none',
                }}
              >
                <IconComponent style={{ width: '22px', height: '22px', color: active ? '#F59E0B' : '#1e293b' }} />
                <span style={{
                  fontSize: '11px',
                  marginTop: '3px',
                  fontWeight: 800,
                  color: active ? '#F59E0B' : '#1e293b',
                  letterSpacing: '0.02em',
                }}>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
