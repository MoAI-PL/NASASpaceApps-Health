# Astrobalance — NASA Space Apps Challenge 2026
# AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
"""UI contract: every exported record validates against schemas/day_record.schema.json."""

import pytest

from src.common import SCHEMA_PATH, UI_OUT_DIR, read_json, schema_validator

SCHEMA = read_json(SCHEMA_PATH)


def _validate(records):
    validator = schema_validator(SCHEMA)
    for record in records:
        validator.validate(record)


def test_sample_json_is_schema_valid():
    sample = read_json(UI_OUT_DIR / "sample.json")
    assert len(sample["records"]) == 90
    _validate(sample["records"])


def test_demo_crew_is_schema_valid():
    path = UI_OUT_DIR / "demo_crew.json"
    if not path.exists():
        pytest.skip("demo_crew.json not generated yet (run `python -m src.export --crew demo`).")
    records = read_json(path)
    assert {r["astronaut"] for r in records} == {"A1", "A2", "A3"}
    _validate(records)


def test_no_real_names_in_ui_data():
    names = {r["display_name"] for r in read_json(UI_OUT_DIR / "sample.json")["records"]}
    assert names == {"Crew Member Alpha", "Crew Member Bravo", "Crew Member Charlie"}


def test_meta_has_rules_scenarios_and_donki_events():
    path = UI_OUT_DIR / "meta.json"
    if not path.exists():
        pytest.skip("meta.json not generated yet.")
    meta = read_json(path)
    critical = meta["rules"]["critical"]
    assert critical and all({"feature", "op", "value", "source", "assumption"} <= set(r) for r in critical)
    assert all((r["source"] is None) == r["assumption"] for r in critical + meta["rules"]["b1"])
    scen = {c["id"]: c["scenario"] for c in meta["crew"]}
    assert scen["A1"] is None and scen["A2"]["id"] == "S1" and scen["A2"]["start_day"] == 50
    assert scen["A3"]["id"] == "S2" and scen["A3"]["start_day"] == 70
    events = meta["space_weather"]["events"]
    assert sorted({e["day"] for e in events}) == meta["space_weather"]["event_days"]
