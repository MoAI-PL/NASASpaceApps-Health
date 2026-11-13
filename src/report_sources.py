# Baseline — NASA Space Apps Challenge 2026
# AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
"""List every configuration entry as SOURCED or ASSUMPTION (markdown, for README → Data & sources).

Usage:
    python -m src.report_sources > outputs/results/config_sources.md
"""

# ===== Imports =====
from __future__ import annotations

from src.common import CONFIG_DIR, load_yaml


# ===== Walk =====
def entries(node, path: str = ""):
    """Yield (path, value, status, note) for every leaf entry that carries a value."""
    if isinstance(node, dict):
        has_flag = "source" in node or "assumption" in node
        if has_flag:
            value = node.get("value", {k: v for k, v in node.items()
                                        if k not in ("source", "assumption", "note", "name", "unit", "role", "could")})
            status = "SOURCED" if node.get("source") else "ASSUMPTION"
            yield path, value, status, node.get("source") or node.get("note", "")
            return
        for key, child in node.items():
            yield from entries(child, f"{path}.{key}" if path else str(key))
    elif isinstance(node, list):
        for i, child in enumerate(node):
            if isinstance(child, dict) and "feature" in child:
                yield from entries(child, f"{path}[{child['feature']} {child.get('op', '')} {child.get('value', '')}]")
            else:
                yield from entries(child, f"{path}[{i}]")


def table() -> str:
    """Markdown table over simulation.yaml, rules.yaml and ui.yaml."""
    lines = ["| Config entry | Status | Source / note |", "|---|---|---|"]
    for name in ["simulation.yaml", "rules.yaml", "ui.yaml"]:
        for path, _, status, note in entries(load_yaml(CONFIG_DIR / name)):
            lines.append(f"| `{name}` {path} | {status} | {str(note).replace('|', '/')} |")
    return "\n".join(lines)


# ===== Main =====
if __name__ == "__main__":
    print(table())
