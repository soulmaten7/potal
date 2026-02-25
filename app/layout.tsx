import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

// [핵심 수정 1] 헤더를 이제 layout 폴더에서 가져옵니다.
import { Header } from "@/components/layout/Header";

// [핵심 수정 2] 푸터도 layout 폴더에서 가져옵니다.
import { Footer } from "@/components/layout/Footer";

// [핵심 수정 3] 모바일 하단 네비게이션 바
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

import { GoogleAnalytics } from "./components/GoogleAnalytics";
import { WishlistProvider } from "./context/WishlistContext";
import { UserPreferenceProvider } from "./context/UserPreferenceContext";
import { SupabaseProvider } from "./context/SupabaseProvider";

const gaId = process.env.NEXT_PUBLIC_GA_ID;

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://potal.app"),
  title: {
    default: "POTAL - Global Best Price vs Local Fast Delivery",
    template: "%s | POTAL",
  },
  description: "Compare prices across Amazon, Walmart, eBay, BestBuy, Target, AliExpress & Temu. AI-powered shopping agent finds the best deal instantly.",
  keywords: ["price comparison", "shopping agent", "best price", "AI shopping", "Amazon", "Walmart", "eBay", "AliExpress", "Temu", "Shein", "best deal", "online shopping"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "POTAL",
  },
  alternates: {
    canonical: "https://potal.app",
  },
  openGraph: {
    type: "website",
    siteName: "POTAL",
    title: "POTAL - Global Best Price vs Local Fast Delivery",
    description: "Compare prices across 7+ major retailers. AI-powered shopping agent finds the best deal instantly.",
    url: "https://potal.app",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "POTAL - AI Shopping Comparison Agent",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "POTAL - AI Shopping Agent",
    description: "Compare prices across Amazon, Walmart, eBay, BestBuy, Target, AliExpress & Temu in one search.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Google Search Console 인증 후 추가
    // google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#02122c" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.variable} ${geistMono.variable} antialiased font-sans text-slate-900`}>
        {/* JSON-LD 구조화 데이터: WebSite + SearchAction (Google Sitelinks Search Box) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "POTAL",
              url: "https://potal.app",
              description: "AI-powered global shopping comparison agent. Compare prices across Amazon, Walmart, eBay, BestBuy, Target, AliExpress & Temu.",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: "https://potal.app/search?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
        {/* PWA Service Worker 등록 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
        
        <SupabaseProvider>
          <UserPreferenceProvider>
            <WishlistProvider>
              
              <div className="flex flex-col min-h-screen relative">
                
                {/* 헤더 */}
                <Header />
                
                {/* 메인 컨텐츠 */}
                <main className="flex-grow w-full">
                  {children}
                </main>
                
                {/* 푸터 — 데스크톱만 */}
                <div className="hidden md:block">
                  <Footer />
                </div>

                {/* 모바일 하단 네비게이션 바 */}
                <MobileBottomNav />
                
              </div>
              
            </WishlistProvider>
          </UserPreferenceProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}