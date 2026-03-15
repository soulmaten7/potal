'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Referral {
  id: string;
  referred_email: string;
  status: string;
  created_at: string;
}

export default function PartnerDashboardPage() {
  const [partnerCode, setPartnerCode] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: partner } = await supabase.from('partner_accounts')
      .select('partner_code, tier, status')
      .eq('user_id', user.id).single();

    if (partner?.partner_code) {
      setPartnerCode(partner.partner_code);
      const { data: refs } = await supabase.from('partner_referrals')
        .select('*')
        .eq('partner_code', partner.partner_code)
        .order('created_at', { ascending: false });
      setReferrals(refs || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const referralLink = partnerCode ? `https://potal.app/ref/${partnerCode}` : '';
  const converted = referrals.filter(r => r.status === 'converted').length;

  if (loading) return <div className="text-center py-8 text-gray-500">Loading...</div>;

  if (!partnerCode) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Partner Program</h1>
        <p className="text-gray-600 mb-6">You are not yet a partner. Apply to join our partner program.</p>
        <a href="/partners" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">
          Apply Now
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Partner Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border rounded-lg p-6">
          <p className="text-sm text-gray-500">Total Referrals</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{referrals.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-6">
          <p className="text-sm text-gray-500">Converted</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{converted}</p>
        </div>
        <div className="bg-white border rounded-lg p-6">
          <p className="text-sm text-gray-500">Conversion Rate</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">
            {referrals.length > 0 ? Math.round(converted / referrals.length * 100) : 0}%
          </p>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Referral Link</h2>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={referralLink}
            className="flex-1 bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-700"
          />
          <button
            onClick={() => navigator.clipboard.writeText(referralLink)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Copy
          </button>
        </div>
      </div>

      {referrals.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {referrals.map(r => (
                <tr key={r.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{r.referred_email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      r.status === 'converted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
