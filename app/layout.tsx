import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "./components/Footer";
import { WishlistProvider } from "./context/WishlistContext";
import { UserPreferenceProvider } from "./context/UserPreferenceContext";
import { SupabaseProvider } from "./context/SupabaseProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "POTAL – Global Best Price vs Local Fast Delivery",
  description: "AI-powered product search. Global best price vs local fast delivery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased font-sans text-slate-800`}
      >
        <SupabaseProvider>
          <UserPreferenceProvider>
            <div className="flex flex-col min-h-screen">
              <WishlistProvider>
                {children}
                <Footer />
              </WishlistProvider>
            </div>
          </UserPreferenceProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
