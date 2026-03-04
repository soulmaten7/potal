"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/icons';
import { useWishlist } from '@/app/context/WishlistContext';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { wishlist } = useWishlist();

  const tabs = [
    { id: 'home', label: 'Search', icon: Icons.Search, href: '/' },
    { id: 'wishlist', label: 'Wishlist', icon: Icons.Heart, href: '/wishlist' },
    { id: 'profile', label: 'Profile', icon: Icons.User, href: '/profile' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' || pathname === '/search';
    return pathname.startsWith(href);
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
                <div className="relative">
                  <IconComponent style={{ width: '22px', height: '22px', color: active ? '#F59E0B' : '#1e293b' }} />
                  {tab.id === 'wishlist' && wishlist.length > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[9px] font-bold min-w-[14px] h-[14px] flex items-center justify-center rounded-full">
                      {wishlist.length > 99 ? '99+' : wishlist.length}
                    </span>
                  )}
                </div>
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
