# Baseline — NASA Space Apps Challenge 2026
# AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
"""Dense autoencoder over 7-day windows of personal z-scores, with a missing-value mask."""

# ===== Imports =====
from __future__ import annotations

from pathlib import Path

import torch
from torch import nn


# ===== Model =====
class Autoencoder(nn.Module):
    """63 → 32 → 8 → 32 → 63 dense autoencoder (sizes from config/model.yaml)."""

    def __init__(self, n_inputs: int, hidden: int = 32, bottleneck: int = 8, dropout: float = 0.1) -> None:
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(n_inputs, hidden), nn.ReLU(), nn.Dropout(dropout),
            nn.Linear(hidden, bottleneck),
        )
        self.decoder = nn.Sequential(
            nn.Linear(bottleneck, hidden), nn.ReLU(), nn.Dropout(dropout),
            nn.Linear(hidden, n_inputs),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Reconstruct the input window."""
        return self.decoder(self.encoder(x))

    def encode(self, x: torch.Tensor) -> torch.Tensor:
        """Latent code of the input window (bottleneck activations)."""
        return self.encoder(x)


# ===== Loss =====
def masked_mse(recon: torch.Tensor, target: torch.Tensor, mask: torch.Tensor) -> torch.Tensor:
    """Mean squared error over observed values only (missing values carry no loss)."""
    squared = mask * (recon - target) ** 2
    return squared.sum() / mask.sum().clamp(min=1.0)


# ===== Device and persistence =====
def pick_device(preference: str = "auto") -> torch.device:
    """`auto` uses CUDA when available, otherwise CPU."""
    if preference == "auto":
        return torch.device("cuda" if torch.cuda.is_available() else "cpu")
    return torch.device(preference)


def save_model(model: Autoencoder, path: str | Path, meta: dict) -> None:
    """Save weights plus the metadata needed to rebuild the model."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    torch.save({"state_dict": model.state_dict(), "meta": meta}, path)


def load_model(path: str | Path) -> tuple[Autoencoder, dict]:
    """Load a saved model on CPU in evaluation mode."""
    payload = torch.load(Path(path), map_location="cpu", weights_only=False)
    meta = payload["meta"]
    model = Autoencoder(meta["n_inputs"], meta["hidden"], meta["bottleneck"], meta["dropout"])
    model.load_state_dict(payload["state_dict"])
    model.eval()
    return model, meta
