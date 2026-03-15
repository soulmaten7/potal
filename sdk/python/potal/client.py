"""
POTAL Python SDK — Sync + Async clients
"""
import json
import time
from typing import Any, Optional
from urllib.request import Request, urlopen
from urllib.error import HTTPError


class PotalError(Exception):
    def __init__(self, status: int, code: str, message: str):
        self.status = status
        self.code = code
        self.message = message
        super().__init__(f"[{status}] {code}: {message}")


class PotalClient:
    """Synchronous POTAL API client."""

    BASE_URL = "https://www.potal.app/api/v1"

    def __init__(self, api_key: str, base_url: Optional[str] = None, timeout: int = 30, max_retries: int = 2):
        self.api_key = api_key
        self.base_url = (base_url or self.BASE_URL).rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "potal-python/1.0.0",
        }

    def _request(self, method: str, path: str, body: Optional[dict] = None, params: Optional[dict] = None) -> dict:
        url = f"{self.base_url}{path}"
        if params:
            qs = "&".join(f"{k}={v}" for k, v in params.items() if v is not None)
            if qs:
                url += f"?{qs}"

        data = json.dumps(body).encode() if body else None
        req = Request(url, data=data, headers=self._headers(), method=method)

        last_err = None
        for attempt in range(self.max_retries + 1):
            try:
                with urlopen(req, timeout=self.timeout) as resp:
                    return json.loads(resp.read().decode())
            except HTTPError as e:
                body_text = e.read().decode() if e.fp else ""
                try:
                    err = json.loads(body_text)
                    raise PotalError(e.code, err.get("error", {}).get("code", "UNKNOWN"), err.get("error", {}).get("message", body_text))
                except (json.JSONDecodeError, PotalError):
                    if isinstance(last_err, PotalError):
                        raise last_err
                    raise PotalError(e.code, "HTTP_ERROR", body_text or str(e))
            except Exception as e:
                last_err = e
                if attempt < self.max_retries:
                    time.sleep(0.5 * (attempt + 1))
                    continue
                raise

        raise last_err or PotalError(500, "RETRY_EXHAUSTED", "Max retries exceeded")

    def calculate(self, price: float, destination_country: str = "US", **kwargs: Any) -> dict:
        """Calculate total landed cost for a single item."""
        return self._request("POST", "/calculate", {
            "price": price,
            "destinationCountry": destination_country,
            **kwargs,
        })

    def classify(self, product_name: str, **kwargs: Any) -> dict:
        """Classify a product to get HS code."""
        return self._request("POST", "/classify", {
            "product_name": product_name,
            **kwargs,
        })

    def validate_hs(self, hs_code: str, country: Optional[str] = None) -> dict:
        """Validate an HS code."""
        body: dict = {"hsCode": hs_code}
        if country:
            body["country"] = country
        return self._request("POST", "/validate", body)

    def screen(self, name: str, country: Optional[str] = None, **kwargs: Any) -> dict:
        """Screen a party against sanctions lists."""
        return self._request("POST", "/screening", {
            "name": name,
            "country": country,
            **kwargs,
        })

    def get_country(self, code: str) -> dict:
        """Get country profile."""
        return self._request("GET", f"/countries/{code}")

    def exchange_rate(self, from_currency: str, to_currency: str, date: Optional[str] = None) -> dict:
        """Get exchange rate."""
        params = {"from": from_currency, "to": to_currency}
        if date:
            params["date"] = date
        return self._request("GET", "/exchange-rate/historical", params=params)

    def batch_calculate(self, items: list, **kwargs: Any) -> dict:
        """Batch calculate landed costs."""
        return self._request("POST", "/classify/batch", {
            "items": items,
            **kwargs,
        })

    def pre_shipment_check(self, hs_code: str, destination: str, **kwargs: Any) -> dict:
        """Run pre-shipment verification."""
        return self._request("POST", "/verify/pre-shipment", {
            "hs_code": hs_code,
            "destination": destination,
            **kwargs,
        })


class AsyncPotalClient:
    """Async POTAL API client (requires aiohttp)."""

    BASE_URL = "https://www.potal.app/api/v1"

    def __init__(self, api_key: str, base_url: Optional[str] = None, timeout: int = 30):
        self.api_key = api_key
        self.base_url = (base_url or self.BASE_URL).rstrip("/")
        self.timeout = timeout
        self._session = None

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "potal-python-async/1.0.0",
        }

    async def _ensure_session(self):
        if self._session is None:
            import aiohttp
            self._session = aiohttp.ClientSession(
                headers=self._headers(),
                timeout=aiohttp.ClientTimeout(total=self.timeout),
            )

    async def _request(self, method: str, path: str, body: Optional[dict] = None, params: Optional[dict] = None) -> dict:
        await self._ensure_session()
        url = f"{self.base_url}{path}"
        async with self._session.request(method, url, json=body, params=params) as resp:
            data = await resp.json()
            if resp.status >= 400:
                err = data.get("error", {})
                raise PotalError(resp.status, err.get("code", "UNKNOWN"), err.get("message", str(data)))
            return data

    async def calculate(self, price: float, destination_country: str = "US", **kwargs: Any) -> dict:
        return await self._request("POST", "/calculate", {"price": price, "destinationCountry": destination_country, **kwargs})

    async def classify(self, product_name: str, **kwargs: Any) -> dict:
        return await self._request("POST", "/classify", {"product_name": product_name, **kwargs})

    async def screen(self, name: str, country: Optional[str] = None, **kwargs: Any) -> dict:
        return await self._request("POST", "/screening", {"name": name, "country": country, **kwargs})

    async def close(self):
        if self._session:
            await self._session.close()
            self._session = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        await self.close()
