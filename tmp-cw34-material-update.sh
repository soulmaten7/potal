#!/bin/bash
# CW34-S1: Add Material/Category consistently to all classification-related endpoints
# Target: lib/playground/scenario-endpoints.ts

cat << 'INSTRUCTIONS'
In lib/playground/scenario-endpoints.ts, make these 4 changes:

=== CHANGE 1: Importer Classify (Precise) — reorder + fix material type ===
Replace the current params array (lines 161-167) with this order:
  ProductName → Material (select) → Category → Origin → HSCode

Old (lines 161-167):
      { key: 'productName', label: 'Product Name', type: 'string', required: true, placeholder: 'Industrial centrifugal water pump', description: 'Be specific — include material, function, use case' },
      { key: 'origin', label: 'Origin', type: 'select', required: false, options: COUNTRY_OPTIONS, description: 'Manufacturing country', defaultValue: 'DE' },
      { key: 'productCategory', label: 'Category', type: 'select', required: false, options: CATEGORY_OPTIONS, description: 'WCO-aligned category hint', defaultValue: 'machinery-pumps' },
      { key: 'hsCode', label: 'HS Code Hint', type: 'string', required: false, placeholder: '8413', description: 'If you know the heading, engine skips classification' },
      { key: 'material', label: 'Material', type: 'string', required: false, placeholder: 'stainless steel', description: 'Primary material for subheading accuracy' },

New:
      { key: 'productName', label: 'Product Name', type: 'string', required: true, placeholder: 'Industrial centrifugal water pump', description: 'Be specific — include material, function, use case' },
      { key: 'material', label: 'Material', type: 'select', required: true, options: MATERIAL_OPTIONS, description: 'Primary material of the product' },
      { key: 'productCategory', label: 'Category', type: 'select', required: false, options: CATEGORY_OPTIONS, description: 'WCO-aligned category hint', defaultValue: 'machinery-pumps' },
      { key: 'origin', label: 'Origin', type: 'select', required: false, options: COUNTRY_OPTIONS, description: 'Manufacturing country', defaultValue: 'DE' },
      { key: 'hsCode', label: 'HS Code Hint', type: 'string', required: false, placeholder: '8413', description: 'If you know the heading, engine skips classification' },

=== CHANGE 2: Seller Calculate — add material + category after productName ===
In SELLER_ENDPOINTS Calculate (line ~81), after the productName param, add material and category:

After:
      { key: 'productName', label: 'Product Name', type: 'string', required: false, placeholder: 'Handmade leather wallet', description: 'For auto HS classification' },
Add:
      { key: 'material', label: 'Material', type: 'select', required: false, options: MATERIAL_OPTIONS, description: 'Primary material of the product' },
      { key: 'productCategory', label: 'Category', type: 'select', required: false, options: CATEGORY_OPTIONS, description: 'Optional hint to improve accuracy' },

=== CHANGE 3: Exporter Calculate — add material + category after productName ===
In EXPORTER_ENDPOINTS Calculate (line ~233), after the productName param, add material and category:

After:
      { key: 'productName', label: 'Product Name', type: 'string', required: false, placeholder: 'Lithium-ion battery cells', description: 'For auto HS classification' },
Add:
      { key: 'material', label: 'Material', type: 'select', required: false, options: MATERIAL_OPTIONS, description: 'Primary material of the product' },
      { key: 'productCategory', label: 'Category', type: 'select', required: false, options: CATEGORY_OPTIONS, description: 'Optional hint to improve accuracy' },

=== CHANGE 4: Exporter Export Controls — add material + category after product_name ===
In EXPORTER_ENDPOINTS Export Controls (line ~268), after the product_name param, add material and category:

After:
      { key: 'product_name', label: 'Product Name', type: 'string', required: false, placeholder: 'Lithium-ion battery cells', description: 'Product name or HS code required' },
Add:
      { key: 'material', label: 'Material', type: 'select', required: false, options: MATERIAL_OPTIONS, description: 'Primary material of the product' },
      { key: 'productCategory', label: 'Category', type: 'select', required: false, options: CATEGORY_OPTIONS, description: 'Optional hint to improve accuracy' },

INSTRUCTIONS
