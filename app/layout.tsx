import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

// [핵심 수정 1] 헤더를 이제 layout 폴더에서 가져옵니다.
import { Header } from "@/components/layout/Header";

// [핵심 수정 2] 푸터도 layout 폴더에서 가져옵니다.
import { Footer } from "@/components/layout/Footer";

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

export const metadata: Metadata = {
  title: "POTAL - Global Best Price vs Local Fast Delivery",
  description: "AI Search Agent for Smart Shopping",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${geistMono.variable} antialiased font-sans text-slate-900 bg-slate-50`}>
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
        
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
                
                {/* 푸터 */}
                <Footer />
                
              </div>
              
            </WishlistProvider>
          </UserPreferenceProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}