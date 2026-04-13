"""CW34-S1: Forward material field in demo/scenario route's buildEngineInput + buildForwarderInputs"""

filepath = 'app/api/demo/scenario/route.ts'
with open(filepath, 'r') as f:
    content = f.read()

# === CHANGE 1: buildEngineInput — add material extraction + enrich productName ===
old_build = """  const product = toStr(inputs.product);
  const from = toStr(inputs.from);
  const to = toStr(inputs.to);
  const unitValue = toNumber(inputs.value);
  const quantity = toNumber(inputs.quantity, 1);
  // CW33-HF3: optional HS classifier hints from the Advanced section
  const category = toStr(inputs.category);
  const hsHint = normalizeHsHint(inputs.hsHint);

  if (!from || !to || unitValue <= 0) return null;

  const totalValue = unitValue * quantity;

  return {
    price: totalValue,
    shippingPrice: 0, // engine auto-estimates when zero
    origin: from.toUpperCase(),
    destinationCountry: to.toUpperCase(),
    productName: product,
    quantity,
    shippingType: 'international',
    productCategory: category,
    hsCode: hsHint,
  };"""

new_build = """  const product = toStr(inputs.product);
  const from = toStr(inputs.from);
  const to = toStr(inputs.to);
  const unitValue = toNumber(inputs.value);
  const quantity = toNumber(inputs.quantity, 1);
  // CW33-HF3: optional HS classifier hints from the Advanced section
  const category = toStr(inputs.category);
  const hsHint = normalizeHsHint(inputs.hsHint);
  // CW34-S1: material field — enrich productName for classifier keyword matching
  const material = toStr(inputs.material);
  const enrichedProduct = material && product && !product.toLowerCase().includes(material.toLowerCase())
    ? `${material} ${product}`
    : product;

  if (!from || !to || unitValue <= 0) return null;

  const totalValue = unitValue * quantity;

  return {
    price: totalValue,
    shippingPrice: 0, // engine auto-estimates when zero
    origin: from.toUpperCase(),
    destinationCountry: to.toUpperCase(),
    productName: enrichedProduct,
    quantity,
    shippingType: 'international',
    productCategory: category,
    hsCode: hsHint,
  };"""

assert old_build in content, "CHANGE 1 FAILED: buildEngineInput old text not found"
content = content.replace(old_build, new_build)
print("✅ CHANGE 1: buildEngineInput — material extracted + enrichedProduct")

# === CHANGE 2: buildForwarderInputs — same material enrichment ===
# Find the product extraction in buildForwarderInputs
old_forwarder_product = """function buildForwarderInputs(
  inputs: Record<string, string | number | string[] | undefined>
): GlobalCostInput[] | null {
  const product = toStr(inputs.product);
  const from = toStr(inputs.from);"""

new_forwarder_product = """function buildForwarderInputs(
  inputs: Record<string, string | number | string[] | undefined>
): GlobalCostInput[] | null {
  const product = toStr(inputs.product);
  const from = toStr(inputs.from);
  // CW34-S1: material field — enrich productName for classifier keyword matching
  const material = toStr(inputs.material);
  const enrichedProduct = material && product && !product.toLowerCase().includes(material.toLowerCase())
    ? `${material} ${product}`
    : product;"""

assert old_forwarder_product in content, "CHANGE 2a FAILED: buildForwarderInputs header not found"
content = content.replace(old_forwarder_product, new_forwarder_product)
print("✅ CHANGE 2a: buildForwarderInputs — material extracted + enrichedProduct")

# Now replace productName: product with productName: enrichedProduct in forwarder
# Find the return object inside buildForwarderInputs
old_forwarder_return = """    productName: product,
    quantity: productQuantity,
    shippingType: 'international' as const,
    productCategory: category,
    hsCode: hsHint,"""

new_forwarder_return = """    productName: enrichedProduct,
    quantity: productQuantity,
    shippingType: 'international' as const,
    productCategory: category,
    hsCode: hsHint,"""

assert old_forwarder_return in content, "CHANGE 2b FAILED: forwarder productName not found"
content = content.replace(old_forwarder_return, new_forwarder_return)
print("✅ CHANGE 2b: buildForwarderInputs — productName: enrichedProduct")

with open(filepath, 'w') as f:
    f.write(content)

print("\n🎯 All changes applied to", filepath)
print("Summary:")
print("  - buildEngineInput: material extracted, enrichedProduct = 'material product' if not already included")
print("  - buildForwarderInputs: same material enrichment applied")
print("  - Engine receives material info via enriched productName for keyword matching")
