"""Matplotlib figure helpers."""

from __future__ import annotations

import base64
import io


def fig_to_b64(fig) -> str:
    import matplotlib.pyplot as plt

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=fig.dpi, facecolor=fig.get_facecolor(), bbox_inches="tight", pad_inches=0.04)
    plt.close(fig)
    return base64.b64encode(buf.getvalue()).decode("ascii")
