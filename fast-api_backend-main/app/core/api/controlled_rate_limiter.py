from collections import defaultdict
from time import monotonic
from typing import DefaultDict, List

from fastapi import HTTPException, Request, status


class ConfigurableRateLimiter:
    """Per-key in-memory rate limiter (source IP by default).

    Spec names fastapi-limiter; that package is not a project dependency, so
    this is a process-local stand-in with the same call shape. Toggle with
    ``enabled=False`` (e.g. tests).
    """

    def __init__(
        self,
        times: int,
        seconds: int,
        *,
        enabled: bool = True,
    ) -> None:
        self.times = times
        self.seconds = seconds
        self.enabled = enabled
        self._hits: DefaultDict[str, List[float]] = defaultdict(list)

    def _client_key(self, request: Request) -> str:
        if request.client is None:
            return "unknown"
        return request.client.host

    async def __call__(self, request: Request) -> None:
        if not self.enabled:
            return
        now = monotonic()
        key = self._client_key(request)
        window_start = now - self.seconds
        recent = [stamp for stamp in self._hits[key] if stamp > window_start]
        if len(recent) >= self.times:
            self._hits[key] = recent
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests.",
            )
        recent.append(now)
        self._hits[key] = recent
