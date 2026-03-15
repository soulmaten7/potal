'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface TaxExemption {
  id: string;
  certificate_type: string;
  jurisdiction: string;
  expiry_date: string | null;
  status: string;
  created_at: string;
}

export default function TaxExemptionsPage() {
  const [exemptions, setExemptions] = useState<TaxExemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ type: 'resale', jurisdiction: '', expiry_date: '' });

  const fetchExemptions = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('tax_exemption_certificates')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });
    setExemptions(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchExemptions(); }, [fetchExemptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('tax_exemption_certificates').insert({
      seller_id: user.id,
      certificate_type: formData.type,
      jurisdiction: formData.jurisdiction,
      expiry_date: formData.expiry_date || null,
      status: 'active',
    });
    setShowForm(false);
    setFormData({ type: 'resale', jurisdiction: '', expiry_date: '' });
    fetchExemptions();
  };

  const typeLabels: Record<string, string> = {
    resale: 'Resale Certificate',
    diplomatic: 'Diplomatic Exemption',
    nonprofit: 'Nonprofit Exemption',
    government: 'Government Exemption',
    export: 'Export Exemption',
  };

  const isExpiringSoon = (date: string | null) => {
    if (!date) return false;
    const diff = new Date(date).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tax Exemption Certificates</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Add Certificate'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Type</label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              {Object.entries(typeLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction</label>
            <input
              type="text"
              value={formData.jurisdiction}
              onChange={e => setFormData({ ...formData, jurisdiction: e.target.value })}
              placeholder="e.g., US-CA, EU, GB"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (optional)</label>
            <input
              type="date"
              value={formData.expiry_date}
              onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            Save Certificate
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : exemptions.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-lg">
          <p className="text-gray-500">No tax exemption certificates yet.</p>
          <p className="text-sm text-gray-400 mt-1">Add certificates to automatically apply tax exemptions.</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jurisdiction</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {exemptions.map(ex => (
                <tr key={ex.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{typeLabels[ex.certificate_type] || ex.certificate_type}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{ex.jurisdiction}</td>
                  <td className="px-6 py-4 text-sm">
                    {ex.expiry_date ? (
                      <span className={isExpiringSoon(ex.expiry_date) ? 'text-orange-600 font-medium' : 'text-gray-900'}>
                        {ex.expiry_date}
                        {isExpiringSoon(ex.expiry_date) && ' (expiring soon)'}
                      </span>
                    ) : (
                      <span className="text-gray-400">No expiry</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      ex.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {ex.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
