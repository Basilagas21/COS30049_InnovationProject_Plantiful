"""Minimal Supabase PostgREST client for the Plantiful IoT simulator.

Standard library only. Uses the service-role key, which bypasses Row Level
Security, because the sensor/alert tables have no insert policy for signed-in
users (see backend/supabase/migrations/002_rls.sql).
"""

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

REQUIRED_ENV = ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")


class SupabaseError(RuntimeError):
    pass


def load_config():
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    missing = [name for name in REQUIRED_ENV if not os.environ.get(name)]
    if missing:
        sys.exit(
            "Missing environment variable(s): "
            + ", ".join(missing)
            + "\nSet SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from "
            "Supabase Dashboard > Project Settings > API "
            "(see backend/.env.example). Never commit the service-role key."
        )
    return url, key


class SupabaseRest:
    def __init__(self, url=None, key=None):
        if url is None or key is None:
            url, key = load_config()
        self.url = url
        self.key = key

    def request(self, method, path, payload=None, params=None, prefer=None):
        target = f"{self.url}/rest/v1/{path}"
        if params:
            target += "?" + urllib.parse.urlencode(params)
        body = None if payload is None else json.dumps(payload).encode("utf-8")
        headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Accept": "application/json",
        }
        if body is not None:
            headers["Content-Type"] = "application/json"
        if prefer:
            headers["Prefer"] = prefer
        req = urllib.request.Request(target, data=body, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                raw = resp.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")
            raise SupabaseError(f"{method} {path} -> HTTP {exc.code}: {detail}") from None
        except urllib.error.URLError as exc:
            raise SupabaseError(f"{method} {path} -> {exc.reason}") from None
        if not raw:
            return None
        return json.loads(raw)

    def select(self, path, params=None):
        return self.request("GET", path, params=params) or []

    def insert(self, path, rows, on_conflict=None, return_representations=True):
        params = {}
        if on_conflict:
            params["on_conflict"] = on_conflict
        prefer = (
            "return=representation,resolution=merge-duplicates"
            if on_conflict
            else ("return=representation" if return_representations else "return=minimal")
        )
        result = self.request("POST", path, payload=rows, params=params, prefer=prefer)
        return result or []
