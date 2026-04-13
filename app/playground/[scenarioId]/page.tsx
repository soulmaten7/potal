'use client';

/**
 * Playground Page — CW34 RapidAPI-style API playground
 *
 * Full-width 3-column layout:
 *   Left sidebar:   endpoint list for the selected scenario
 *   Center:         parameter input form + Test Endpoint button
 *   Right:          Code Snippets / Example Responses / Results tabs
 *
 * Each scenario defines its own endpoint chain (e.g., seller = classify →
 * restrictions → calculate). Selecting an endpoint in the sidebar updates
 * the center + right panels.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSupabase } from '@/app/context/SupabaseProvider';
import { Sidebar } from '@/components/playground/Sidebar';
import { ParamsPanel } from '@/components/playground/ParamsPanel';
import { CodePanel } from '@/components/playground/CodePanel';
import { SCENARIO_ENDPOINTS, type EndpointDef } from '@/lib/playground/scenario-endpoints';

export default function PlaygroundPage() {
  const params = useParams();
  const scenarioId = (params?.scenarioId as string) || 'seller';
  const { session } = useSupabase();

  const endpoints = SCENARIO_ENDPOINTS[scenarioId] || SCENARIO_ENDPOINTS.seller;
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>(endpoints[0]?.id || '');
  const [apiKey, setApiKey] = useState('');
  // Seed initial paramValues with defaultValue from the first endpoint
  const [paramValues, setParamValues] = useState<Record<string, string>>(() => {
    const ep = endpoints[0];
    if (!ep) return {};
    const defaults: Record<string, string> = {};
    for (const p of ep.params) {
      if (p.defaultValue) defaults[p.key] = p.defaultValue;
    }
    return defaults;
  });
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  // CW34: Fetch user's API key prefix for dynamic placeholder
  const [keyPrefix, setKeyPrefix] = useState<string | null>(null);
  const [keyLoading, setKeyLoading] = useState(false);

  useEffect(() => {
    if (!session?.access_token) {
      setKeyPrefix(null);
      return;
    }
    let cancelled = false;
    setKeyLoading(true);
    fetch('/api/v1/sellers/me', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(json => {
        if (cancelled) return;
        const keys = json?.data?.keys;
        if (Array.isArray(keys)) {
          const active = keys.find(
            (k: { type: string; isActive: boolean }) =>
              k.type === 'publishable' && k.isActive,
          );
          setKeyPrefix(active?.prefix ?? null);
        }
      })
      .catch(() => { /* ignore — demo mode fallback */ })
      .finally(() => { if (!cancelled) setKeyLoading(false); });
    return () => { cancelled = true; };
  }, [session?.access_token]);

  const currentEndpoint: EndpointDef | undefined = endpoints.find(e => e.id === selectedEndpoint);

  const handleTest = async () => {
    if (!currentEndpoint) return;
    setLoading(true);
    setResult(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['X-API-Key'] = apiKey;
      else headers['X-Demo-Request'] = 'true';

      // Build body from paramValues using the endpoint's param definitions
      // Fall back to defaultValue so pre-filled dropdowns are always sent
      const body: Record<string, unknown> = {};
      for (const p of currentEndpoint.params) {
        const val = paramValues[p.key] || p.defaultValue || '';
        if (val === undefined || val === '') continue;
        // Parse JSON string fields (e.g. routes) into actual arrays/objects
        if (p.key === 'routes' || p.key === 'items') {
          try { body[p.key] = JSON.parse(val as string); continue; } catch { /* send as string */ }
        }
        body[p.key] = p.type === 'number' ? Number(val) : val;
      }

      const res = await fetch(currentEndpoint.path, {
        method: currentEndpoint.method,
        headers,
        body: JSON.stringify(body),
      });
      const json = await res.json();
      setResult(json);
    } catch (err) {
      setResult({ error: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] w-full bg-white">
      {/* Left sidebar */}
      <Sidebar
        scenarioId={scenarioId}
        endpoints={endpoints}
        selectedEndpoint={selectedEndpoint}
        onSelect={id => {
          setSelectedEndpoint(id);
          setResult(null);
          // Seed paramValues with defaultValue so defaults are sent to API
          const ep = endpoints.find(e => e.id === id);
          const defaults: Record<string, string> = {};
          if (ep) {
            for (const p of ep.params) {
              if (p.defaultValue) defaults[p.key] = p.defaultValue;
            }
          }
          setParamValues(defaults);
        }}
      />

      {/* Center — params */}
      <ParamsPanel
        endpoint={currentEndpoint}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        paramValues={paramValues}
        onParamChange={(key, val) => setParamValues(prev => ({ ...prev, [key]: val }))}
        onTest={handleTest}
        loading={loading}
        isLoggedIn={!!session}
        keyPrefix={keyPrefix}
        keyLoading={keyLoading}
        result={result}
        endpointId={selectedEndpoint}
      />

      {/* Right — code + results */}
      <CodePanel
        endpoint={currentEndpoint}
        paramValues={paramValues}
        apiKey={apiKey}
        result={result}
      />
    </div>
  );
}
