/**
 * POTAL API v1 — /api/v1/import/template
 * Returns CSV template for batch import
 */
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { NextRequest } from 'next/server';

const CSV_TEMPLATE = `id,product_name,price,shipping_price,origin,destination,hs_code,product_category,weight_kg,quantity,shipping_terms
SKU-001,Cotton T-Shirt,25.00,5.00,CN,US,610910,Clothing,0.3,10,DDP
SKU-002,Leather Wallet,45.00,8.00,IT,US,420231,Accessories,0.2,5,DDU
SKU-003,Running Shoes,120.00,12.00,VN,DE,640411,Footwear,0.8,2,DDP`;

export const GET = withApiAuth(async (_req: NextRequest, _ctx: ApiAuthContext) => {
  return new Response(CSV_TEMPLATE, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="potal-import-template.csv"',
    },
  });
});
