import { Suspense } from 'react';
import DashboardContent from './DashboardContent';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#888', fontSize: 14 }}>Loading dashboard...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
