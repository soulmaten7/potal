'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DailyUsage {
  date: string;
  success: number;
  failed: number;
}

export default function DailyUsageChart({ data }: { data: DailyUsage[] }) {
  const hasData = data.some(d => d.success > 0 || d.failed > 0);

  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Daily API Calls</h3>
      {!hasData ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>&#128202;</div>
          <div style={{ fontSize: 14 }}>No API calls yet. Make your first request to see data here.</div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#888' }}
              tickFormatter={(v: string) => {
                const d = new Date(v + 'T00:00:00');
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
              interval={Math.max(0, Math.floor(data.length / 8) - 1)}
            />
            <YAxis tick={{ fontSize: 11, fill: '#888' }} allowDecimals={false} />
            <Tooltip
              labelFormatter={(v) => {
                const d = new Date(String(v) + 'T00:00:00');
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              }}
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="success" name="Success" fill="#10b981" radius={[3, 3, 0, 0]} stackId="a" />
            <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[3, 3, 0, 0]} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
