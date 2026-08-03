#!/usr/bin/env python3
"""Upsert CRON_NOTIFY_TO in the VPS app .env (base64 via CRON_NOTIFY_B64)."""
from __future__ import annotations

import base64
import os
import pathlib
import sys

app = pathlib.Path(os.environ.get("APP_DIR", "/home/yuzdehesaplama/private/freshcalendars-app"))
raw = os.environ.get("CRON_NOTIFY_B64", "").strip()
if not raw:
    print("CRON_NOTIFY_B64 missing", file=sys.stderr)
    sys.exit(1)
to = base64.b64decode(raw).decode()
envf = app / ".env"
text = envf.read_text() if envf.exists() else ""
lines = [ln for ln in text.splitlines() if not ln.startswith("CRON_NOTIFY_TO=")]
lines.append(f"CRON_NOTIFY_TO={to}")
envf.write_text("\n".join(lines).rstrip() + "\n")
print("CRON_NOTIFY_TO upserted on VPS")
