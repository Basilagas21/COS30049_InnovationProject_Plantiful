"""Minimal Supabase PostgREST client for the Plantiful IoT simulator.

Standard library only. Uses the service-role key, which bypasses Row Level
Security, because the sensor/alert tables have no insert policy for signed-in
users (see backend/supabase/migrations/apply_project.sql).
"""

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

REQUIRED_ENV = ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")
ENV_ALIASES = {"NEXT_PUBLIC_SUPABASE_URL": "SUPABASE_URL"}
ENV_FILES = (
    Path(__file__).resolve().parent / ".env",
    Path(__file__).resolve().parent.parent / "web" / ".env.local",
)


# HTTP statuses that mean the request itself is invalid (bad or conflicting
# data), so sending the same row again can never succeed. Everything else,
# including network failures, timeouts, 5xx and auth errors, may recover.
PERMANENT_STATUSES = frozenset({400, 409, 422})


class SupabaseError(RuntimeError):
    def __init__(self, message, status=None):
        super().__init__(message)
        self.status = status

    @property
    def retryable(self):
        return self.status not in PERMANENT_STATUSES


def _load_env_file(path):
    if not path.is_file():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        name = name.strip()
        if name.startswith("export "):
            name = name[len("export "):].strip()
        value = value.strip().strip('"').strip("'")
        target = ENV_ALIASES.get(name, name)
        if target in REQUIRED_ENV and value and not os.environ.get(target):
            os.environ[target] = value


def load_config():
    for path in ENV_FILES:
        _load_env_file(path)
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    missing = [name for name in REQUIRED_ENV if not os.environ.get(name)]
    if missing:
        sys.exit(
            "Missing environment variable(s): "
            + ", ".join(missing)
            + "\nSet SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in iot/.env "
            "or web/.env.local, or export them in the terminal. "
            "See backend/.env.example. Never commit the service-role key."
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
            raise SupabaseError(f"{method} {path} -> HTTP {exc.code}: {detail}", exc.code) from None
        except urllib.error.URLError as exc:
            raise SupabaseError(f"{method} {path} -> {exc.reason}") from None
        except OSError as exc:
            # A timeout or reset while reading the response is not a URLError;
            # without this it escaped and crashed the bridge (#46).
            raise SupabaseError(f"{method} {path} -> {type(exc).__name__}: {exc}") from None
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
