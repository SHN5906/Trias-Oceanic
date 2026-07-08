"""Create ERPNext users and assign their roles.

EDIT THE USERS LIST BELOW with real names and emails before executing —
the script refuses to run against the placeholder .example addresses.

Dry-run by default. With --execute: new users are created and receive a
welcome email to set their password; existing users get any missing roles
added. Role names must match ERPNext built-in roles exactly.

Usage:
    python scripts/create_users.py             # dry run (offline)
    python scripts/create_users.py --execute
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from api_client import ERPNextClient, ERPNextError

# See docs/roles-permissions.md for the role rationale.
# "Sales Manager" (GM/owner) approves quotations > 50,000 PGK — see
# customizations/workflows.md.
USERS: tuple[dict[str, Any], ...] = (
    {
        "email": "sales@triasoceanic.example",      # EDIT: sales rep
        "first_name": "Sales",
        "last_name": "Rep",
        "roles": ("Sales User",),
    },
    {
        "email": "warehouse@triasoceanic.example",  # EDIT: storeman
        "first_name": "Warehouse",
        "last_name": "Storeman",
        "roles": ("Stock User",),
    },
    {
        "email": "accounts@triasoceanic.example",   # EDIT: accountant
        "first_name": "Accounts",
        "last_name": "Manager",
        "roles": ("Accounts User", "Accounts Manager"),
    },
    {
        "email": "gm@triasoceanic.example",         # EDIT: GM / quote approver
        "first_name": "General",
        "last_name": "Manager",
        "roles": ("Sales User", "Sales Manager"),
    },
)


def ensure_user(client: ERPNextClient, spec: dict[str, Any]) -> str:
    """Create the user or add missing roles. Returns a status string."""
    email = spec["email"]
    if client.exists("User", email):
        current = client.get_doc("User", email)
        have = {row["role"] for row in current.get("roles", [])}
        missing = [role for role in spec["roles"] if role not in have]
        if not missing:
            return "skip (exists, roles ok)"
        merged = sorted(have | set(missing))
        client.update_doc("User", email, {"roles": [{"role": r} for r in merged]})
        return f"updated (added roles: {', '.join(missing)})"
    client.insert_doc(
        "User",
        {
            "doctype": "User",
            "email": email,
            "first_name": spec["first_name"],
            "last_name": spec.get("last_name", ""),
            "user_type": "System User",
            "send_welcome_email": 1,
            "language": "en",
            "roles": [{"role": role} for role in spec["roles"]],
        },
    )
    return "created (welcome email sent)"


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--execute", action="store_true",
                        help="create/update the users (default: dry run)")
    parser.add_argument("--env", help="path to .env file")
    args = parser.parse_args()

    placeholders = [u["email"] for u in USERS if u["email"].endswith(".example")]

    print(f"{len(USERS)} user(s) defined:\n")
    for user in USERS:
        print(f"  {user['email']:40} roles: {', '.join(user['roles'])}")

    if not args.execute:
        print("\nDry run only — re-run with --execute to create/update these users.")
        if placeholders:
            print(f"! {len(placeholders)} placeholder email(s) still need editing "
                  "before --execute will run.")
        return

    if placeholders:
        sys.exit(
            "Refusing to execute: placeholder .example emails still in USERS: "
            + ", ".join(placeholders)
        )

    client = ERPNextClient.from_env(args.env)
    failed = 0
    for user in USERS:
        try:
            status = ensure_user(client, user)
        except ERPNextError as exc:
            print(f"✗ {user['email']}: {exc}", file=sys.stderr)
            failed += 1
        else:
            print(f"✓ {user['email']}: {status}")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
