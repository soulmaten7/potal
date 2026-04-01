# POTAL Python SDK

Total Landed Cost API for cross-border commerce. 140 features, 240 countries, Forever Free.

## Install
```
pip install potal
```

## Quick Start
```python
from potal import PotalClient

client = PotalClient("your-api-key")

# Calculate total landed cost
result = client.calculate(
    product_name="Cotton T-Shirt",
    price=49.99,
    origin="CN",
    destination="US"
)
print(result)

# Classify HS Code
hs = client.classify(product_name="Cotton T-Shirt", material="Cotton")
print(hs)

# Get exchange rate
rate = client.exchange_rate(from_currency="USD", to_currency="KRW")
print(rate)
```

## Async Support
```python
from potal import AsyncPotalClient

async def main():
    client = AsyncPotalClient("your-api-key")
    result = await client.calculate(product_name="Cotton T-Shirt", price=49.99)
    print(result)
```

## Links
- Docs: https://www.potal.app/developers
- API Reference: https://www.potal.app/developers/docs
- Dashboard: https://www.potal.app/dashboard
