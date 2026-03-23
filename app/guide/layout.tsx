import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Classification Guide — 9-Field Input Standards | POTAL',
  description: 'Complete guide for HS Code classification input fields. Learn the legal standards (WCO, ISO, SI) and validation rules for each of the 9 fields to achieve 100% classification accuracy.',
  openGraph: {
    title: 'Classification Guide — 9-Field Input Standards | POTAL',
    description: 'WCO-based classification standards for 100% HS Code accuracy.',
    type: 'website',
  },
};

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
