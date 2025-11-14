import time
from datetime import datetime, timezone

import rfc3339


def format_rfc3339(timestamp: datetime, microseconds=False) -> str:
    formatter = rfc3339.rfc3339
    if microseconds:
        formatter = rfc3339.format_microsecond
    return formatter(timestamp, utc=True)


def current_utc():
    return datetime.fromtimestamp(time.time(), timezone.utc)
