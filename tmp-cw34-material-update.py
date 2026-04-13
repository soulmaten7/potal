"""CW34-S1: Add Material/Category consistently to all classification-related endpoints"""
import re

filepath = 'lib/playground/scenario-endpoints.ts'
with open(filepath, 'r') as f:
    content = f.read()

# === CHANGE 1: Importer Classify (Precise) — reorder + fix material type ===
old_importer = """      { key: 'productName', label: 'Product Name', type: 'string', required: true, placeholder: 'Industrial centrifugal water pump', description: 'Be specific — include material, function, use case' },
      { key: 'origin', label: 'Origin', type: 'select', required: false, options: COUNTRY_OPTIONS, description: 'Manufacturing country', defaultValue: 'DE' },
      { key: 'productCategory', label: 'Category', type: 'select', required: false, options: CATEGORY_OPTIONS, description: 'WCO-aligned category hint', defaultValue: 'machinery-pumps' },
      { key: 'hsCode', label: 'HS Code Hint', type: 'string', required: false, placeholder: '8413', description: 'If you know the heading, engine skips classification' },
      { key: 'material', label: 'Material', type: 'string', required: false, placeholder: 'stainless steel', description: 'Primary material for subheading accuracy' },"""

new_importer = """      { key: 'productName', label: 'Product Name', type: 'string', required: true, placeholder: 'Industrial centrifugal water pump', description: 'Be specific — include material, function, use case' },
      { key: 'material', label: 'Material', type: 'select', required: true, options: MATERIAL_OPTIONS, description: 'Primary material of the product' },
      { key: 'productCategory', label: 'Category', type: 'select', required: false, options: CATEGORY_OPTIONS, description: 'WCO-aligned category hint', defaultValue: 'machinery-pumps' },
      { key: 'origin', label: 'Origin', type: 'select', required: false, options: COUNTRY_OPTIONS, description: 'Manufacturing country', defaultValue: 'DE' },
      { key: 'hsCode', label: 'HS Code Hint', type: 'string', required: false, placeholder: '8413', description: 'If you know the heading, engine skips classification' },"""

assert old_importer in content, "CHANGE 1 FAILED: Importer old text not found"
content = content.replace(old_importer, new_importer)
print("✅ CHANGE 1: Importer Classify — material string→select, reordered")

# === CHANGE 2: Seller Calculate — add material + category after productName ===
old_seller_calc = """      { key: 'productName', label: 'Product Name', type: 'string', required: false, placeholder: 'Handmade leather wallet', description: 'For auto HS classification' },
      { key: 'price', label: 'Price', type: 'number', required: true, placeholder: '45', description: 'Product price in declared currency' },"""

new_seller_calc = """      { key: 'productName', label: 'Product Name', type: 'string', required: false, placeholder: 'Handmade leather wallet', description: 'For auto HS classification' },
      { key: 'material', label: 'Material', type: 'select', required: false, options: MATERIAL_OPTIONS, description: 'Primary material of the product' },
      { key: 'productCategory', label: 'Category', type: 'select', required: false, options: CATEGORY_OPTIONS, description: 'Optional hint to improve accuracy' },
      { key: 'price', label: 'Price', type: 'number', required: true, placeholder: '45', description: 'Product price in declared currency' },"""

assert old_seller_calc in content, "CHANGE 2 FAILED: Seller Calculate old text not found"
content = content.replace(old_seller_calc, new_seller_calc)
print("✅ CHANGE 2: Seller Calculate — material + category added")

# === CHANGE 3: Exporter Calculate — add material + category after productName ===
old_exporter_calc = """      { key: 'productName', label: 'Product Name', type: 'string', required: false, placeholder: 'Lithium-ion battery cells', description: 'For auto HS classification' },
      { key: 'price', label: 'Price', type: 'number', required: true, placeholder: '250000', description: 'Shipment value in declared currency' },"""

new_exporter_calc = """      { key: 'productName', label: 'Product Name', type: 'string', required: false, placeholder: 'Lithium-ion battery cells', description: 'For auto HS classification' },
      { key: 'material', label: 'Material', type: 'select', required: false, options: MATERIAL_OPTIONS, description: 'Primary material of the product' },
      { key: 'productCategory', label: 'Category', type: 'select', required: false, options: CATEGORY_OPTIONS, description: 'Optional hint to improve accuracy' },
      { key: 'price', label: 'Price', type: 'number', required: true, placeholder: '250000', description: 'Shipment value in declared currency' },"""

assert old_exporter_calc in content, "CHANGE 3 FAILED: Exporter Calculate old text not found"
content = content.replace(old_exporter_calc, new_exporter_calc)
print("✅ CHANGE 3: Exporter Calculate — material + category added")

# === CHANGE 4: Exporter Export Controls — add material + category after product_name ===
old_export_ctrl = """      { key: 'product_name', label: 'Product Name', type: 'string', required: false, placeholder: 'Lithium-ion battery cells', description: 'Product name or HS code required' },
      { key: 'hs_code', label: 'HS Code', type: 'string', required: false, placeholder: '850760', description: 'HS code for ECCN mapping' },"""

new_export_ctrl = """      { key: 'product_name', label: 'Product Name', type: 'string', required: false, placeholder: 'Lithium-ion battery cells', description: 'Product name or HS code required' },
      { key: 'material', label: 'Material', type: 'select', required: false, options: MATERIAL_OPTIONS, description: 'Primary material of the product' },
      { key: 'productCategory', label: 'Category', type: 'select', required: false, options: CATEGORY_OPTIONS, description: 'Optional hint to improve accuracy' },
      { key: 'hs_code', label: 'HS Code', type: 'string', required: false, placeholder: '850760', description: 'HS code for ECCN mapping' },"""

assert old_export_ctrl in content, "CHANGE 4 FAILED: Export Controls old text not found"
content = content.replace(old_export_ctrl, new_export_ctrl)
print("✅ CHANGE 4: Exporter Export Controls — material + category added")

with open(filepath, 'w') as f:
    f.write(content)

print("\n🎯 All 4 changes applied to", filepath)
print("Summary:")
print("  - Importer Classify: material string→select, field reorder (ProductName→Material→Category→Origin→HSCode)")
print("  - Seller Calculate: +material +category after productName")
print("  - Exporter Calculate: +material +category after productName")
print("  - Exporter Export Controls: +material +category after product_name")
