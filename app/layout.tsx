import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "./components/Footer";
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

const siteUrl = "https://www.potal.com";

export const metadata: Metadata = {
  title: "POTAL - Global Best Price vs Local Fast Delivery",
  description:
    "Compare prices across Amazon, AliExpress, Temu, and more. Find the best deals on Lego, Tech, and Camping gear with real-time shipping analysis.",
  keywords: [
    "price comparison",
    "global shipping",
    "amazon vs aliexpress",
    "cheap deals",
    "potal",
  ],
  openGraph: {
    type: "website",
    title: "POTAL - Global Best Price vs Local Fast Delivery",
    description:
      "Compare prices across Amazon, AliExpress, Temu, and more. Find the best deals on Lego, Tech, and Camping gear with real-time shipping analysis.",
    url: siteUrl,
  },
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
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
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
