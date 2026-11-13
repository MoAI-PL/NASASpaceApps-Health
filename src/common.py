# Baseline — NASA Space Apps Challenge 2026
# AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
"""Shared paths, feature lists and small helpers used by every module."""

# ===== Imports =====
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

import yaml

# ===== Paths =====
ROOT = Path(__file__).resolve().parents[1]
CONFIG_DIR = ROOT / "config"
DATA_DIR = ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
SYNTH_DIR = DATA_DIR / "synthetic"
OUTPUTS_DIR = ROOT / "outputs"
MODELS_DIR = OUTPUTS_DIR / "models"
RESULTS_DIR = OUTPUTS_DIR / "results"
FIGURES_DIR = OUTPUTS_DIR / "figures"
UI_OUT_DIR = OUTPUTS_DIR / "ui"
SCHEMA_PATH = ROOT / "schemas" / "day_record.schema.json"

# ===== Feature lists =====
INDICATORS: list[str] = ["sys", "dia", "hr", "glucose", "temp", "sleep_h", "mood", "reaction_ms"]
AE_FEATURES: list[str] = INDICATORS + ["exercise_min"]
CONTEXT: list[str] = ["radiation_mGy", "cabin_co2_mmHg"]
SYSTEM_OF: dict[str, str] = {
    "sys": "heart", "dia": "heart", "hr": "heart",
    "glucose": "metabolism",
    "sleep_h": "mind_sleep", "mood": "mind_sleep", "reaction_ms": "mind_sleep",
    "temp": "immune_temp",
}
SYSTEMS: list[str] = ["heart", "metabolism", "mind_sleep", "immune_temp"]
LEVELS: list[str] = ["green", "yellow", "orange", "red"]
DISCLAIMER = "Synthetic data calibrated on published sources — proof of concept, not clinical validation."


# ===== Helpers =====
def load_yaml(path: str | Path) -> dict[str, Any]:
    """Load a YAML file into a dictionary."""
    with open(path, "r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def val(entry: Any) -> Any:
    """Return the `value` of a config entry, or the entry itself when it is a plain value."""
    if isinstance(entry, dict) and "value" in entry:
        return entry["value"]
    return entry


def config_hash(obj: Any) -> str:
    """Stable short SHA-256 hash of any JSON-serialisable object (used to tag outputs)."""
    payload = json.dumps(obj, sort_keys=True, default=str).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()[:12]


def file_hash(path: str | Path) -> str:
    """Short SHA-256 hash of a file's bytes."""
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()[:12]


def write_json(path: str | Path, obj: Any, indent: int | None = 2) -> None:
    """Write JSON with UTF-8 encoding, creating parent folders."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(obj, handle, indent=indent, ensure_ascii=False)
        handle.write("\n")


def read_json(path: str | Path) -> Any:
    """Read a JSON file."""
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def schema_validator(schema: dict):
    """JSON-schema validator matching the schema's $schema draft (Draft 7 fallback on old jsonschema)."""
    import jsonschema

    cls = jsonschema.validators.validator_for(schema, default=jsonschema.Draft7Validator)
    return cls(schema)


def level_rank(level: str) -> int:
    """Order of severity: green < yellow < orange < red."""
    return LEVELS.index(level)
