"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';
import { useSupabase } from '@/app/context/SupabaseProvider';
import { LoginModal } from '@/components/auth/LoginModal';
import { lookupZip, validateZip } from '@/app/lib/utils/zipCodeDatabase';

type SubPage = null | 'account' | 'settings' | 'help' | 'legal';

export default function ProfilePage() {
  const router = useRouter();
  const { supabase, session } = useSupabase();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [activePage, setActivePage] = useState<SubPage>(null);
  const [slideIn, setSlideIn] = useState(false);

  // ─── Zipcode 상태 ───
  const [primaryZip, setPrimaryZip] = useState('');
  const [savedZips, setSavedZips] = useState<string[]>([]);
  const [inputZip, setInputZip] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const [zipSuccess, setZipSuccess] = useState('');
  const [zipError, setZipError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('user_currency');
    if (saved) setCurrency(saved);

    // Zipcode 로드
    const active = localStorage.getItem('potal_zipcode') || '';
    setPrimaryZip(active);
    try {
      const list = JSON.parse(localStorage.getItem('potal_zipcode_list') || '[]');
      setSavedZips(Array.isArray(list) ? list : []);
    } catch {
      setSavedZips([]);
    }
  }, []);

  // ─── Zipcode 기능 ───
  const setAsPrimary = (zip: string) => {
    setPrimaryZip(zip);
    localStorage.setItem('potal_zipcode', zip);
    setZipSuccess(zip);
    setTimeout(() => setZipSuccess(''), 1500);
  };

  const handleAddZipcode = () => {
    const zip = inputZip.trim();
    if (!zip) return;
    setZipError('');
    // ZIP 코드 유효성 검증
    if (!validateZip(zip)) {
      setZipError('Invalid ZIP code. Please enter a valid US ZIP code.');
      return;
    }
    if (savedZips.includes(zip)) {
      setInputZip('');
      return;
    }
    const newList = [...savedZips, zip];
    setSavedZips(newList);
    localStorage.setItem('potal_zipcode_list', JSON.stringify(newList));
    if (!primaryZip) setAsPrimary(zip);
    setInputZip('');
    setShowAddInput(false);
  };

  const handleDeleteZip = (zipToDelete: string) => {
    const newList = savedZips.filter(z => z !== zipToDelete);
    setSavedZips(newList);
    localStorage.setItem('potal_zipcode_list', JSON.stringify(newList));
    if (primaryZip === zipToDelete) {
      setPrimaryZip('');
      localStorage.removeItem('potal_zipcode');
    }
  };

  const handleCurrencyChange = (c: 'USD' | 'KRW') => {
    setCurrency(c);
    localStorage.setItem('user_currency', c);
    window.location.reload();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const openSubPage = (page: SubPage) => {
    setActivePage(page);
    requestAnimationFrame(() => setSlideIn(true));
  };

  const closeSubPage = () => {
    setSlideIn(false);
    setTimeout(() => setActivePage(null), 300);
  };

  const userEmail = session?.user?.email || '';
  const userInitial = userEmail?.[0]?.toUpperCase() || 'U';

  // ─── 서브 페이지 헤더 ───
  const SubPageHeader = ({ title }: { title: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px 12px' }}>
      <button onClick={closeSubPage} style={{
        width: '36px', height: '36px', borderRadius: '9999px',
        background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: 'none', cursor: 'pointer',
      }}>
        <Icons.ChevronLeft style={{ width: '20px', height: '20px', color: '#ffffff' }} />
      </button>
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>{title}</h2>
    </div>
  );

  // ─── 서브 페이지: Account ───
  const AccountPage = () => (
    <div>
      <SubPageHeader title="Account" />
      <div style={{ padding: '8px 20px' }} className="space-y-3">
        {/* 유저 정보 카드 */}
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', padding: '20px' }}>
          <div className="flex items-center gap-4">
            <div style={{
              width: '56px', height: '56px', borderRadius: '9999px',
              background: session ? 'linear-gradient(135deg, #F59E0B, #f97316)' : 'rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', fontWeight: 800, color: '#ffffff',
            }}>
              {session ? userInitial : <Icons.User style={{ width: '28px', height: '28px', color: 'rgba(255,255,255,0.4)' }} />}
            </div>
            <div>
              {session ? (
                <>
                  <p style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>{userEmail}</p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>POTAL Member</p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>Guest</p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Log in to sync your data</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Primary Zipcode (읽기 전용 — Saved Locations에서 Set Primary로 변경) ── */}
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '16px 20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Primary Zipcode</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: primaryZip ? (zipSuccess === primaryZip ? 'rgba(52,211,153,0.2)' : 'rgba(245,158,11,0.15)') : 'rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.3s',
            }}>
              <Icons.MapPin style={{ width: '20px', height: '20px', color: primaryZip ? (zipSuccess === primaryZip ? '#34d399' : '#F59E0B') : 'rgba(255,255,255,0.25)' }} />
            </div>
            <div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace', display: 'block' }}>
                {primaryZip || 'Not set'}
              </span>
              {zipSuccess === primaryZip && primaryZip ? (
                <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 700 }}>Saved!</span>
              ) : primaryZip && lookupZip(primaryZip) ? (
                <span style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 700 }}>{lookupZip(primaryZip)!.city}, {lookupZip(primaryZip)!.state}</span>
              ) : !primaryZip ? (
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Add a location below to set</span>
              ) : null}
            </div>
          </div>
        </div>

        {/* ── Add New Location ── */}
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          {showAddInput ? (
            <div style={{ padding: '16px 20px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>Add New Location</p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={5}
                value={inputZip}
                onChange={(e) => { setInputZip(e.target.value.replace(/\D/g, '').slice(0, 5)); setZipError(''); }}
                placeholder="e.g. 90210"
                autoFocus
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px', fontSize: '16px', fontWeight: 700,
                  background: 'rgba(255,255,255,0.1)',
                  border: zipError ? '1px solid #ef4444' : inputZip.length === 5 && lookupZip(inputZip) ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.2)',
                  color: '#ffffff', outline: 'none', fontFamily: 'monospace', marginBottom: '4px',
                  boxSizing: 'border-box',
                }}
              />
              {/* ZIP 실시간 검증 피드백 */}
              {inputZip.length === 5 && lookupZip(inputZip) && (
                <p style={{ fontSize: '12px', color: '#34d399', fontWeight: 700, marginBottom: '8px' }}>
                  📍 {lookupZip(inputZip)!.city}, {lookupZip(inputZip)!.state}
                </p>
              )}
              {zipError && (
                <p style={{ fontSize: '12px', color: '#ef4444', fontWeight: 700, marginBottom: '8px' }}>{zipError}</p>
              )}
              {inputZip.length === 5 && !lookupZip(inputZip) && !zipError && (
                <p style={{ fontSize: '12px', color: '#ef4444', fontWeight: 700, marginBottom: '8px' }}>Invalid ZIP code</p>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleAddZipcode} disabled={!inputZip.trim()} style={{
                  flex: 1, padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
                  background: inputZip.trim() ? '#F59E0B' : 'rgba(255,255,255,0.08)',
                  border: 'none', color: inputZip.trim() ? '#ffffff' : 'rgba(255,255,255,0.25)',
                  cursor: inputZip.trim() ? 'pointer' : 'not-allowed',
                }}>Add</button>
                <button onClick={() => { setShowAddInput(false); setInputZip(''); }} style={{
                  flex: 1, padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddInput(true)}
              style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icons.Plus style={{ width: '20px', height: '20px', color: '#F59E0B' }} />
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Add New Location</span>
              </div>
              <Icons.ChevronRight style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.25)' }} />
            </button>
          )}
        </div>

        {/* ── Saved Locations ── */}
        {savedZips.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px 4px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Saved Locations ({savedZips.length})
              </p>
            </div>
            {savedZips.map((zip, idx) => (
              <React.Fragment key={zip}>
                {idx > 0 && <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 20px' }} />}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>{zip}</span>
                    {lookupZip(zip) && (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{lookupZip(zip)!.city}, {lookupZip(zip)!.stateCode}</span>
                    )}
                    {primaryZip === zip && (
                      <span style={{
                        fontSize: '10px', fontWeight: 700, color: '#F59E0B',
                        background: 'rgba(245,158,11,0.15)', padding: '2px 8px', borderRadius: '6px',
                      }}>Active</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {primaryZip !== zip && (
                      <button onClick={() => setAsPrimary(zip)} style={{
                        fontSize: '11px', fontWeight: 700, color: '#F59E0B',
                        background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px',
                      }}>Set Primary</button>
                    )}
                    <button onClick={() => handleDeleteZip(zip)} style={{
                      width: '28px', height: '28px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icons.X style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.3)' }} />
                    </button>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Saved Locations 비어있을 때 */}
        {savedZips.length === 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.04)', borderRadius: '16px',
            border: '1px dashed rgba(255,255,255,0.1)', padding: '20px', textAlign: 'center',
          }}>
            <Icons.Globe style={{ width: '24px', height: '24px', color: 'rgba(255,255,255,0.2)', margin: '0 auto 8px' }} />
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>No saved locations yet</p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>Add a zipcode above to get started</p>
          </div>
        )}

        {/* 로그인/로그아웃 */}
        {session ? (
          <button onClick={handleLogout} style={{
            width: '100%', padding: '14px', borderRadius: '16px', fontSize: '14px', fontWeight: 700,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#f87171', cursor: 'pointer',
          }}>
            Log out
          </button>
        ) : (
          <button onClick={() => setShowLoginModal(true)} style={{
            width: '100%', padding: '14px', borderRadius: '16px', fontSize: '15px', fontWeight: 800,
            background: '#F59E0B', border: 'none', color: '#ffffff', cursor: 'pointer',
          }}>
            Log in or sign up
          </button>
        )}
      </div>
    </div>
  );

  // ─── 서브 페이지: Settings ───
  const SettingsPage = () => (
    <div>
      <SubPageHeader title="Settings" />
      <div style={{ padding: '8px 20px' }} className="space-y-3">
        {/* Language & Currency */}
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Language & Currency</p>
            <div className="space-y-2">
              <button onClick={() => handleCurrencyChange('USD')} style={{
                width: '100%', textAlign: 'left', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: currency === 'USD' ? '#F59E0B' : 'rgba(255,255,255,0.08)',
                color: currency === 'USD' ? '#ffffff' : 'rgba(255,255,255,0.6)',
                border: currency === 'USD' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
              }}>
                <span>🇺🇸 English (USD)</span>
                {currency === 'USD' && <Icons.Check style={{ width: '16px', height: '16px' }} />}
              </button>
              <div style={{
                width: '100%', textAlign: 'left', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.25)',
                border: '1px solid rgba(255,255,255,0.04)', cursor: 'not-allowed',
              }}>
                <span>🇰🇷 한국어 (KRW)</span>
                <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>Soon</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications placeholder */}
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <Icons.Bell style={{ width: '20px', height: '20px', color: 'rgba(255,255,255,0.5)' }} />
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Notifications</span>
            </div>
            <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>Soon</span>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── 서브 페이지: Help ───
  const HelpPage = () => (
    <div>
      <SubPageHeader title="Help" />
      <div style={{ padding: '8px 20px' }} className="space-y-3">
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          {[
            { href: '/help', icon: Icons.Info, label: 'Help Center', desc: 'Get answers to common questions' },
            { href: '/partners', icon: Icons.Box, label: 'Affiliate Disclosure', desc: 'How POTAL earns revenue' },
            { href: '/about', icon: Icons.Star, label: 'About POTAL', desc: 'Our mission and team' },
          ].map((item, idx) => (
            <React.Fragment key={item.href}>
              {idx > 0 && <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 20px' }} />}
              <Link href={item.href} className="flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <item.icon style={{ width: '20px', height: '20px', color: '#F59E0B' }} />
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', display: 'block' }}>{item.label}</span>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{item.desc}</span>
                  </div>
                </div>
                <Icons.ChevronRight style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.25)' }} />
              </Link>
            </React.Fragment>
          ))}
        </div>

        {/* Contact */}
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>Need more help?</p>
          <a href="mailto:support@potal.app" style={{ fontSize: '14px', fontWeight: 700, color: '#F59E0B', textDecoration: 'none' }}>
            support@potal.app
          </a>
        </div>
      </div>
    </div>
  );

  // ─── 서브 페이지: Legal ───
  const LegalPage = () => (
    <div>
      <SubPageHeader title="Legal" />
      <div style={{ padding: '8px 20px' }} className="space-y-3">
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          {[
            { href: '/legal/terms', label: 'Terms of Service' },
            { href: '/legal/privacy', label: 'Privacy Policy' },
            { href: '/legal/cookie', label: 'Cookie Policy' },
            { href: '/legal/privacy-settings', label: 'Privacy Settings' },
          ].map((item, idx) => (
            <React.Fragment key={item.href}>
              {idx > 0 && <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 20px' }} />}
              <Link href={item.href} className="flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors">
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{item.label}</span>
                <Icons.ChevronRight style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.2)' }} />
              </Link>
            </React.Fragment>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.25)', paddingTop: '8px' }}>
          POTAL v1.0 · © 2026 POTAL Inc.
        </p>
      </div>
    </div>
  );

  // ─── 메인 카드 타일 데이터 ───
  const tiles = [
    { id: 'account' as SubPage, icon: Icons.User, label: 'Account', desc: session ? userEmail : 'Log in / Sign up', color: '#F59E0B' },
    { id: 'settings' as SubPage, icon: Icons.Globe, label: 'Settings', desc: 'Language & Currency', color: '#60a5fa' },
    { id: 'help' as SubPage, icon: Icons.Info, label: 'Help', desc: 'FAQs & Support', color: '#34d399' },
    { id: 'legal' as SubPage, icon: Icons.Shield, label: 'Legal', desc: 'Terms & Privacy', color: '#a78bfa' },
  ];

  return (
    <div style={{ backgroundColor: '#02122c', overflow: 'hidden', position: 'relative' }} className="min-h-screen pb-28">

      {/* ═══ 메인 페이지 ═══ */}
      <div style={{
        transition: 'transform 0.3s ease, opacity 0.3s ease',
        transform: activePage ? 'translateX(-30%)' : 'translateX(0)',
        opacity: activePage ? 0 : 1,
        pointerEvents: activePage ? 'none' : 'auto',
      }}>
        {/* 타이틀 */}
        <div style={{ padding: '24px 20px 16px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>Profile</h1>
        </div>

        {/* 로그인 배너 (비로그인 시) */}
        {!session && (
          <div style={{ padding: '0 20px 16px' }}>
            <button
              onClick={() => setShowLoginModal(true)}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)', padding: '16px 20px',
                textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px',
              }}
            >
              <div style={{
                width: '44px', height: '44px', borderRadius: '9999px', flexShrink: 0,
                background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icons.User style={{ width: '22px', height: '22px', color: '#F59E0B' }} />
              </div>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', marginBottom: '2px' }}>Log in or sign up</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Sync your data across devices</p>
              </div>
            </button>
          </div>
        )}

        {/* 로그인 시 유저 배너 */}
        {session && (
          <div style={{ padding: '0 20px 16px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.08)', borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.1)', padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: '14px',
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '9999px', flexShrink: 0,
                background: 'linear-gradient(135deg, #F59E0B, #f97316)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', fontWeight: 800, color: '#ffffff',
              }}>
                {userInitial}
              </div>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>{userEmail}</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>POTAL Member</p>
              </div>
            </div>
          </div>
        )}

        {/* ─── 카드 타일 2x2 그리드 ─── */}
        <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {tiles.map((tile) => {
            const IconComp = tile.icon;
            return (
              <button
                key={tile.id}
                onClick={() => openSubPage(tile.id)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '20px 16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: `${tile.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <IconComp style={{ width: '20px', height: '20px', color: tile.color }} />
                </div>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', marginBottom: '2px' }}>{tile.label}</p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.3' }}>{tile.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Version */}
        <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '24px' }}>
          POTAL v1.0 · © 2026 POTAL Inc.
        </p>
      </div>

      {/* ═══ 슬라이드 서브 페이지 ═══ */}
      {activePage && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#02122c',
          transition: 'transform 0.3s ease',
          transform: slideIn ? 'translateX(0)' : 'translateX(100%)',
          overflowY: 'auto',
          minHeight: '100vh',
          paddingBottom: '120px',
        }}>
          {activePage === 'account' && <AccountPage />}
          {activePage === 'settings' && <SettingsPage />}
          {activePage === 'help' && <HelpPage />}
          {activePage === 'legal' && <LegalPage />}
        </div>
      )}

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onSuccess={() => setShowLoginModal(false)} />
    </div>
  );
}
