'use client';

import { useState } from 'react';
import { INTEGRATIONS, type IntegrationConfig } from '@/app/lib/integrations/base';

export default function IntegrationsPage() {
  const [selected, setSelected] = useState<IntegrationConfig | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleConnect = async () => {
    if (!selected) return;
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/v1/sellers/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect_integration',
          platform: selected.platform,
          credentials: formValues,
        }),
      });
      if (res.ok) {
        setMessage(`${selected.name} connected successfully!`);
        setSelected(null);
        setFormValues({});
      } else {
        setMessage('Connection failed. Please check your credentials.');
      }
    } catch {
      setMessage('Connection error. Please try again.');
    }
    setSaving(false);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Integrations</h1>
      <p className="text-gray-600 mb-8">Connect your e-commerce platforms and accounting tools.</p>

      {message && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">{message}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {INTEGRATIONS.map(integration => (
          <div
            key={integration.platform}
            className="border rounded-lg p-6 bg-white hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{integration.icon}</span>
              <div>
                <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  integration.status === 'connected' ? 'bg-green-100 text-green-700' :
                  integration.status === 'available' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {integration.status === 'connected' ? 'Connected' :
                   integration.status === 'available' ? 'Available' : 'Coming Soon'}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">{integration.description}</p>
            {integration.status === 'available' ? (
              <button
                onClick={() => { setSelected(integration); setFormValues({}); }}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Connect
              </button>
            ) : integration.status === 'coming_soon' ? (
              <button disabled className="w-full bg-gray-100 text-gray-400 px-4 py-2 rounded-lg text-sm cursor-not-allowed">
                Coming Soon
              </button>
            ) : (
              <button disabled className="w-full bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm cursor-not-allowed">
                Connected
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Connection modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Connect {selected.icon} {selected.name}
            </h2>
            <div className="space-y-4">
              {selected.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={formValues[field.key] || ''}
                    onChange={e => setFormValues({ ...formValues, [field.key]: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    required={field.required}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
