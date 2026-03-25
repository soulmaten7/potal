"""
POTAL Python SDK v1.1.0 — Sync + Async clients
"""
import json
import time
from typing import Any, Dict, List, Optional
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from urllib.parse import urlencode


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

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "potal-python/1.1.0",
        }

    def _request(self, method: str, path: str, body: Optional[dict] = None, params: Optional[dict] = None) -> dict:
        url = f"{self.base_url}{path}"
        if params:
            filtered = {k: v for k, v in params.items() if v is not None}
            if filtered:
                url += f"?{urlencode(filtered)}"

        data = json.dumps(body).encode() if body else None
        req = Request(url, data=data, headers=self._headers(), method=method)

        last_err: Optional[Exception] = None
        for attempt in range(self.max_retries + 1):
            try:
                with urlopen(req, timeout=self.timeout) as resp:
                    return json.loads(resp.read().decode())
            except HTTPError as e:
                body_text = e.read().decode() if e.fp else ""
                try:
                    err_data = json.loads(body_text)
                    err_obj = err_data.get("error", {})
                    potal_err = PotalError(e.code, err_obj.get("code", "UNKNOWN"), err_obj.get("message", body_text))
                except json.JSONDecodeError:
                    potal_err = PotalError(e.code, "HTTP_ERROR", body_text or str(e))

                # 429 Rate Limit — wait and retry
                if e.code == 429:
                    retry_after = int(e.headers.get("Retry-After", "1")) if e.headers else 1
                    time.sleep(retry_after)
                    last_err = potal_err
                    continue

                # 4xx (except 429) — don't retry
                if e.code < 500:
                    raise potal_err

                # 5xx — retry
                last_err = potal_err
                if attempt < self.max_retries:
                    time.sleep(0.5 * (attempt + 1))
                    continue
                raise potal_err

            except PotalError:
                raise  # Re-raise PotalError without wrapping

            except Exception as e:
                last_err = e
                if attempt < self.max_retries:
                    time.sleep(0.5 * (attempt + 1))
                    continue
                raise

        raise last_err or PotalError(500, "RETRY_EXHAUSTED", "Max retries exceeded")

    # ─── Core Methods ─────────────────────────────

    def calculate(self, price: float, destination_country: str = "US", **kwargs: Any) -> dict:
        """Calculate total landed cost for a single item."""
        return self._request("POST", "/calculate", {"price": price, "destinationCountry": destination_country, **kwargs})

    def classify(self, product_name: str, **kwargs: Any) -> dict:
        """Classify a product to get HS code."""
        return self._request("POST", "/classify", {"product_name": product_name, **kwargs})

    def validate_hs(self, hs_code: str, country: Optional[str] = None) -> dict:
        """Validate an HS code."""
        body: dict = {"hsCode": hs_code}
        if country:
            body["country"] = country
        return self._request("POST", "/validate", body)

    def screen(self, name: str, country: Optional[str] = None, **kwargs: Any) -> dict:
        """Screen a party against sanctions lists."""
        return self._request("POST", "/screening", {"name": name, "country": country, **kwargs})

    def get_country(self, code: str) -> dict:
        """Get country profile."""
        return self._request("GET", f"/countries/{code}")

    def exchange_rate(self, from_currency: str, to_currency: str, date: Optional[str] = None) -> dict:
        """Get exchange rate."""
        params = {"from": from_currency, "to": to_currency}
        if date:
            params["date"] = date
        return self._request("GET", "/exchange-rate/historical", params=params)

    def batch_calculate(self, items: List[dict], **kwargs: Any) -> dict:
        """Batch calculate landed costs."""
        return self._request("POST", "/calculate/batch", {"items": items, **kwargs})

    def pre_shipment_check(self, hs_code: str, destination: str, **kwargs: Any) -> dict:
        """Run pre-shipment verification."""
        return self._request("POST", "/verify/pre-shipment", {"hs_code": hs_code, "destination": destination, **kwargs})


class AsyncPotalClient:
    """Async POTAL API client (requires aiohttp)."""

    BASE_URL = "https://www.potal.app/api/v1"

    def __init__(self, api_key: str, base_url: Optional[str] = None, timeout: int = 30, max_retries: int = 2):
        self.api_key = api_key
        self.base_url = (base_url or self.BASE_URL).rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "potal-python-async/1.1.0",
        }

    async def _request(self, method: str, path: str, body: Optional[dict] = None, params: Optional[dict] = None) -> dict:
        import aiohttp
        import asyncio

        url = f"{self.base_url}{path}"
        if params:
            filtered = {k: v for k, v in params.items() if v is not None}
            if filtered:
                url += f"?{urlencode(filtered)}"

        timeout = aiohttp.ClientTimeout(total=self.timeout)
        last_err: Optional[Exception] = None

        for attempt in range(self.max_retries + 1):
            try:
                async with aiohttp.ClientSession(timeout=timeout) as session:
                    async with session.request(method, url, headers=self._headers(), json=body) as resp:
                        # Parse JSON safely
                        try:
                            data = await resp.json()
                        except Exception:
                            text = await resp.text()
                            raise PotalError(resp.status, "INVALID_JSON", f"Invalid JSON: {text[:200]}")

                        # 429 Rate Limit
                        if resp.status == 429:
                            retry_after = int(resp.headers.get("Retry-After", "1"))
                            await asyncio.sleep(retry_after)
                            continue

                        if resp.status >= 400:
                            err = data.get("error", {}) if isinstance(data, dict) else {}
                            potal_err = PotalError(resp.status, err.get("code", "UNKNOWN"), err.get("message", str(data)))
                            if resp.status < 500:
                                raise potal_err
                            last_err = potal_err
                            if attempt < self.max_retries:
                                await asyncio.sleep(0.5 * (attempt + 1))
                                continue
                            raise potal_err

                        return data

            except PotalError:
                raise

            except Exception as e:
                last_err = e
                if attempt < self.max_retries:
                    import asyncio
                    await asyncio.sleep(0.5 * (attempt + 1))
                    continue
                raise

        raise last_err or PotalError(500, "RETRY_EXHAUSTED", "Max retries exceeded")

    # ─── All 8 methods (matching sync client) ─────

    async def calculate(self, price: float, destination_country: str = "US", **kwargs: Any) -> dict:
        return await self._request("POST", "/calculate", {"price": price, "destinationCountry": destination_country, **kwargs})

    async def classify(self, product_name: str, **kwargs: Any) -> dict:
        return await self._request("POST", "/classify", {"product_name": product_name, **kwargs})

    async def validate_hs(self, hs_code: str, country: Optional[str] = None) -> dict:
        body: dict = {"hsCode": hs_code}
        if country:
            body["country"] = country
        return await self._request("POST", "/validate", body)

    async def screen(self, name: str, country: Optional[str] = None, **kwargs: Any) -> dict:
        return await self._request("POST", "/screening", {"name": name, "country": country, **kwargs})

    async def get_country(self, code: str) -> dict:
        return await self._request("GET", f"/countries/{code}")

    async def exchange_rate(self, from_currency: str, to_currency: str, date: Optional[str] = None) -> dict:
        params = {"from": from_currency, "to": to_currency}
        if date:
            params["date"] = date
        return await self._request("GET", "/exchange-rate/historical", params=params)

    async def batch_calculate(self, items: List[dict], **kwargs: Any) -> dict:
        return await self._request("POST", "/calculate/batch", {"items": items, **kwargs})

    async def pre_shipment_check(self, hs_code: str, destination: str, **kwargs: Any) -> dict:
        return await self._request("POST", "/verify/pre-shipment", {"hs_code": hs_code, "destination": destination, **kwargs})
