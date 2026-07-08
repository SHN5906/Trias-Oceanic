"""Availability check for the Trias Oceanic ERPNext site.

The basis of the monthly maintenance routine — run it manually or on a cron.
Checks: HTTP reachability (ping), authenticated API access, document reads.
Exit code 0 = healthy, 1 = at least one check failed (cron/alert friendly).

Usage:
    python scripts/healthcheck.py [--env path/to/.env]

Cron example (every 15 min, alert on failure via your scheduler):
    */15 * * * * cd /path/to/repo && python scripts/healthcheck.py >> healthcheck.log 2>&1
"""
from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path
from typing import Callable

sys.path.insert(0, str(Path(__file__).resolve().parent))
from api_client import ERPNextClient


def check(label: str, func: Callable[[], str]) -> bool:
    start = time.monotonic()
    try:
        detail = func()
    except Exception as exc:  # report any failure, never crash the run
        print(f"✗ {label}: {exc}")
        return False
    elapsed_ms = (time.monotonic() - start) * 1000
    print(f"✓ {label}: {detail} ({elapsed_ms:.0f} ms)")
    return True


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--env", help="path to .env file")
    args = parser.parse_args()

    client = ERPNextClient.from_env(args.env)
    print(f"Site: {client.base_url}")

    healthy = check("ping", lambda: str(client.call("ping")["message"]))
    healthy &= check(
        "auth",
        lambda: str(client.call("frappe.auth.get_logged_user")["message"]),
    )
    healthy &= check(
        "read",
        lambda: client.get_list("Company", fields=["name"], limit=1)[0]["name"],
    )

    print("HEALTHY" if healthy else "UNHEALTHY")
    sys.exit(0 if healthy else 1)


if __name__ == "__main__":
    main()
