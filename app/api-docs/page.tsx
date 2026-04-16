'use client';

import dynamic from 'next/dynamic';
import type { Metadata } from 'next';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">POTAL API Documentation</h1>
          <p className="text-sm text-slate-500 mt-1">
            Interactive API reference — 8 endpoints for global trade automation. Forever Free.
          </p>
          <div className="flex gap-3 mt-3 flex-wrap">
            <a href="/openapi.json" target="_blank" className="text-xs px-3 py-1.5 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200">
              OpenAPI JSON
            </a>
            <a
              href="/api/v1/postman"
              download="potal-api.postman_collection.json"
              className="text-xs px-3 py-1.5 rounded-md bg-orange-50 text-orange-700 hover:bg-orange-100 font-semibold"
            >
              ↓ Postman Collection
            </a>
            <a href="/workspace/export" className="text-xs px-3 py-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100">
              Try in Workspace
            </a>
          </div>
        </div>
        <SwaggerUI
          url="/openapi.json"
          docExpansion="list"
          defaultModelsExpandDepth={1}
          tryItOutEnabled={false}
        />
      </div>
    </div>
  );
}
