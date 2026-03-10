import { Suspense } from 'react';
import DashboardContent from './DashboardContent';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: 'calc(100vh - 80px)', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#888', fontSize: 14 }}>Loading dashboard...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
