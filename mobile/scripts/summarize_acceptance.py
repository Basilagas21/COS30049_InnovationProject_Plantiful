"""Summarize and export a copied test device's SQLite acceptance events.

Usage: python mobile/scripts/summarize_acceptance.py plantiful.db --raw events.csv
Copy the SQLite file from a development device first; this script opens it
read-only and never contacts Supabase or changes device data.
"""

import argparse
import csv
import json
import sqlite3
import sys
from pathlib import Path


def summarize(rows):
    sync = [row for row in rows if row["operation"] == "sync_record"]
    local_qr = [row for row in rows if row["operation"] == "qr_lookup" and row["outcome"] == "local_found"]
    successes = sum(row["outcome"] == "synced" for row in sync)
    fast = sum(row["duration_ms"] < 5000 for row in local_qr)
    return {
        "sync_attempts": len(sync),
        "sync_successes": successes,
        "sync_success_percent": round(100 * successes / len(sync), 2) if sync else None,
        "cached_qr_samples": len(local_qr),
        "cached_qr_under_5000ms": fast,
        "cached_qr_average_ms": round(sum(row["duration_ms"] for row in local_qr) / len(local_qr), 2) if local_qr else None,
        "first_event": rows[0]["measured_at"] if rows else None,
        "last_event": rows[-1]["measured_at"] if rows else None,
        "qr_missing_and_error": sum(row["operation"] == "qr_lookup" and row["outcome"] in ("not_found", "error") for row in rows),
    }


def main():
    parser = argparse.ArgumentParser(description="Summarize dated mobile acceptance measurements")
    parser.add_argument("database", help="copied plantiful.db from a test device")
    parser.add_argument("--raw", help="write all raw dated events as CSV to this path")
    args = parser.parse_args()
    columns = ("id", "measured_at", "operation", "outcome", "duration_ms", "detail")
    try:
        with sqlite3.connect(f"{Path(args.database).resolve().as_uri()}?mode=ro", uri=True) as db:
            db.row_factory = sqlite3.Row
            rows = [dict(row) for row in db.execute(
                f"SELECT {', '.join(columns)} FROM acceptance_measurements ORDER BY id"
            )]
    except sqlite3.Error as exc:
        sys.exit(f"Could not read measurements: {exc}")
    if args.raw:
        with open(args.raw, "w", newline="", encoding="utf-8") as output:
            writer = csv.DictWriter(output, fieldnames=columns)
            writer.writeheader()
            writer.writerows(rows)
    print(json.dumps(summarize(rows), indent=2))


if __name__ == "__main__":
    main()
