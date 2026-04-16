import { redirect } from 'next/navigation';

/**
 * /api-docs → /workspace/export redirect.
 * Swagger UI page removed (CW38-HF9): Workspace already provides better API docs + testing.
 * openapi.json remains at /openapi.json for LLM/Postman/developer tool consumption.
 */
export default function ApiDocsPage() {
  redirect('/workspace/export');
}
