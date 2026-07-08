"""Reusable ERPNext REST API client — token auth, basic retries, no heavy deps.

API reference: https://docs.frappe.io/framework/user/en/api/rest
Auth header:   Authorization: token <api_key>:<api_secret>
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any
from urllib.parse import quote

import requests

RETRYABLE_STATUS = {429, 500, 502, 503, 504}


class ERPNextError(Exception):
    """Error response from the ERPNext API."""

    def __init__(self, status_code: int, message: str) -> None:
        self.status_code = status_code
        self.message = message
        super().__init__(f"HTTP {status_code}: {message}")


def load_env(path: str | Path | None = None) -> dict[str, str]:
    """Read a KEY=VALUE .env file without external dependencies."""
    candidates = (
        [Path(path)]
        if path
        else [Path(".env"), Path(__file__).resolve().parent / ".env"]
    )
    for candidate in candidates:
        if candidate.is_file():
            env: dict[str, str] = {}
            for raw in candidate.read_text(encoding="utf-8").splitlines():
                line = raw.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, value = line.partition("=")
                env[key.strip()] = value.strip().strip("'\"")
            return env
    raise FileNotFoundError(
        "No .env file found. Copy scripts/config.example.env to scripts/.env "
        "and fill in ERPNEXT_URL, ERPNEXT_API_KEY, ERPNEXT_API_SECRET."
    )


class ERPNextClient:
    """Thin wrapper over the ERPNext REST API (/api/resource, /api/method)."""

    def __init__(
        self,
        base_url: str,
        api_key: str,
        api_secret: str,
        timeout: float = 30.0,
        max_retries: int = 3,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries
        self.session = requests.Session()
        self.session.headers.update(
            {
                "Authorization": f"token {api_key}:{api_secret}",
                "Accept": "application/json",
                "Content-Type": "application/json",
            }
        )

    @classmethod
    def from_env(cls, path: str | Path | None = None) -> "ERPNextClient":
        env = load_env(path)
        missing = [
            key
            for key in ("ERPNEXT_URL", "ERPNEXT_API_KEY", "ERPNEXT_API_SECRET")
            if not env.get(key)
        ]
        if missing:
            raise KeyError(f"Missing keys in .env: {', '.join(missing)}")
        return cls(env["ERPNEXT_URL"], env["ERPNEXT_API_KEY"], env["ERPNEXT_API_SECRET"])

    # -- low level ------------------------------------------------------

    def _request(
        self,
        method: str,
        path: str,
        params: dict[str, Any] | None = None,
        payload: dict[str, Any] | None = None,
    ) -> Any:
        url = f"{self.base_url}{path}"
        last_error: Exception | None = None
        for attempt in range(1, self.max_retries + 1):
            try:
                response = self.session.request(
                    method, url, params=params, json=payload, timeout=self.timeout
                )
            except requests.RequestException as exc:
                last_error = exc
            else:
                if response.status_code < 400:
                    return response.json() if response.content else None
                if response.status_code not in RETRYABLE_STATUS:
                    raise ERPNextError(response.status_code, _error_message(response))
                last_error = ERPNextError(response.status_code, _error_message(response))
            if attempt < self.max_retries:
                time.sleep(2 ** (attempt - 1))
        if isinstance(last_error, ERPNextError):
            raise last_error
        raise ERPNextError(
            0, f"Connection failed after {self.max_retries} attempts: {last_error}"
        )

    # -- documents ------------------------------------------------------

    def get_doc(self, doctype: str, name: str) -> dict[str, Any]:
        data = self._request("GET", f"/api/resource/{quote(doctype)}/{quote(name)}")
        return data["data"]

    def get_list(
        self,
        doctype: str,
        filters: dict[str, Any] | None = None,
        fields: list[str] | None = None,
        limit: int = 0,
    ) -> list[dict[str, Any]]:
        params: dict[str, Any] = {"limit_page_length": limit}
        if filters:
            params["filters"] = json.dumps(filters)
        if fields:
            params["fields"] = json.dumps(fields)
        data = self._request("GET", f"/api/resource/{quote(doctype)}", params=params)
        return data["data"]

    def insert_doc(self, doctype: str, doc: dict[str, Any]) -> dict[str, Any]:
        data = self._request("POST", f"/api/resource/{quote(doctype)}", payload=doc)
        return data["data"]

    def update_doc(
        self, doctype: str, name: str, updates: dict[str, Any]
    ) -> dict[str, Any]:
        data = self._request(
            "PUT", f"/api/resource/{quote(doctype)}/{quote(name)}", payload=updates
        )
        return data["data"]

    def exists(self, doctype: str, name: str) -> bool:
        try:
            self.get_doc(doctype, name)
            return True
        except ERPNextError as exc:
            if exc.status_code == 404:
                return False
            raise

    def call(self, method: str, params: dict[str, Any] | None = None) -> Any:
        """GET /api/method/<method> — whitelisted server methods."""
        return self._request("GET", f"/api/method/{method}", params=params)


def _error_message(response: requests.Response) -> str:
    try:
        body = response.json()
    except ValueError:
        return response.text[:300]
    for key in ("exception", "exc_type", "message", "_server_messages"):
        if body.get(key):
            return str(body[key])[:300]
    return response.text[:300]
