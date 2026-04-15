'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { EndpointSidebar, ENDPOINTS } from '@/components/workspace/EndpointSidebar';
import { EndpointPanel } from '@/components/workspace/EndpointPanel';
import { CodeSnippetPanel } from '@/components/workspace/CodeSnippetPanel';

export default function WorkspacePage() {
  const params = useParams();
  const direction = params.direction as string;
  const isExport = direction === 'export';

  const [selectedEndpoint, setSelectedEndpoint] = useState(isExport ? 'classify' : 'calculate');
  const [currentParams, setCurrentParams] = useState<Record<string, unknown>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const endpoint = ENDPOINTS.find(e => e.id === selectedEndpoint);

  const handleSelect = (id: string) => {
    // Guides open in new tab
    const ep = ENDPOINTS.find(e => e.id === id);
    if (ep?.group === 'guides') {
      window.open(ep.path, '_blank');
      return;
    }
    setSelectedEndpoint(id);
    setCurrentParams({});
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar — fixed 280px */}
      <EndpointSidebar
        selected={selectedEndpoint}
        onSelect={handleSelect}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Center + Right — equal split */}
      <div className="flex flex-1 min-w-0">
        {/* Center Panel — Parameters + Result */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <EndpointPanel
            endpointId={selectedEndpoint}
            onParamsChange={setCurrentParams}
          />
        </div>

        {/* Right Panel — Code Snippet (equal width to center on lg+) */}
        <div className="hidden lg:flex lg:flex-1 min-w-0">
          <CodeSnippetPanel
            endpointPath={endpoint?.path || ''}
            method={endpoint?.method || 'POST'}
            params={currentParams}
          />
        </div>
      </div>
    </div>
  );
}
