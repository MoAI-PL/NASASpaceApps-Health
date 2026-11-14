# Astrobalance — NASA Space Apps Challenge 2026
# AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
"""Fetch and cache real Solar Energetic Particle (SEP) events from NASA DONKI.

Usage:
    python -m src.donki --start 2024-05-01 --days 120

The raw API responses are cached in data/raw/donki_sep.json. Every other module reads only the
cache, so the pipeline runs offline once this script has been executed with network access.
"""

# ===== Imports =====
from __future__ import annotations

import argparse
import datetime as dt
import sys

from src.common import RAW_DIR, read_json, write_json

# ===== Constants =====
DONKI_SEP_URL = "https://ccmc.gsfc.nasa.gov/DONKI-API/get/SEP"
CACHE_PATH = RAW_DIR / "donki_sep.json"
MAX_WINDOW_DAYS = 60  # DONKI accepts query windows of at most 60 days


# ===== Fetching =====
def date_chunks(start: dt.date, days: int, chunk: int = MAX_WINDOW_DAYS) -> list[tuple[dt.date, dt.date]]:
    """Split [start, start + days - 1] into windows no longer than `chunk` days."""
    end = start + dt.timedelta(days=days - 1)
    chunks, cursor = [], start
    while cursor <= end:
        stop = min(cursor + dt.timedelta(days=chunk - 1), end)
        chunks.append((cursor, stop))
        cursor = stop + dt.timedelta(days=1)
    return chunks


def fetch_sep_events(start: dt.date, days: int, timeout: float = 30.0) -> list[dict]:
    """Query DONKI for SEP events in the mission window (requires network access)."""
    import requests  # imported here so offline modules never need it

    events: list[dict] = []
    for lo, hi in date_chunks(start, days):
        params = {"startDate": lo.isoformat(), "endDate": hi.isoformat()}
        response = requests.get(DONKI_SEP_URL, params=params, timeout=timeout)
        response.raise_for_status()
        events.extend(response.json() or [])
    return events


# ===== Cache =====
def load_cache() -> dict | None:
    """Return the cached DONKI payload, or None when the cache does not exist."""
    if CACHE_PATH.exists():
        return read_json(CACHE_PATH)
    return None


def sep_event_days(start_date: str, days: int) -> tuple[list[int], str]:
    """Mission days (1-based) with at least one cached SEP event, plus a status string.

    Status is "cached" when real DONKI data was used, or "missing" when no cache exists
    (then no SEP events are simulated and the README states this).
    """
    cache = load_cache()
    if cache is None:
        return [], "missing"
    start = dt.date.fromisoformat(start_date)
    hit_days: set[int] = set()
    for event in cache.get("events", []):
        stamp = str(event.get("eventTime", ""))[:10]
        try:
            day = (dt.date.fromisoformat(stamp) - start).days + 1
        except ValueError:
            continue
        if 1 <= day <= days:
            hit_days.add(day)
    return sorted(hit_days), "cached"


def sep_events(start_date: str, days: int) -> list[dict]:
    """Cached SEP events inside the mission window: mission day, time, DONKI id and link (for the UI)."""
    cache = load_cache()
    if cache is None:
        return []
    start = dt.date.fromisoformat(start_date)
    out = []
    for event in cache.get("events", []):
        stamp = str(event.get("eventTime", ""))
        try:
            day = (dt.date.fromisoformat(stamp[:10]) - start).days + 1
        except ValueError:
            continue
        if 1 <= day <= days:
            out.append({"day": day, "time": stamp, "id": event.get("sepID"), "link": event.get("link")})
    return sorted(out, key=lambda e: (e["day"], e["time"]))


# ===== Main =====
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Cache NASA DONKI SEP events for the mission window.")
    parser.add_argument("--start", default="2024-05-01", help="Mission day 1 (YYYY-MM-DD).")
    parser.add_argument("--days", type=int, default=120, help="Mission length in days.")
    args = parser.parse_args()

    start_date = dt.date.fromisoformat(args.start)
    try:
        sep_events = fetch_sep_events(start_date, args.days)
    except Exception as error:  # network problems are expected offline
        cached = load_cache()
        if cached is None:
            print(f"DONKI request failed ({error}) and no cache exists. SEP events will be empty.")
            sys.exit(1)
        print(f"DONKI request failed ({error}); keeping the existing cache with {len(cached['events'])} events.")
        sys.exit(0)

    write_json(CACHE_PATH, {
        "source": DONKI_SEP_URL,
        "start": args.start,
        "days": args.days,
        "retrieved": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "events": sep_events,
    })
    print(f"Cached {len(sep_events)} SEP events to {CACHE_PATH}")
