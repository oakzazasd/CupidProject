import threading
import time
from collections import deque
from dataclasses import dataclass


@dataclass
class Limiter:
    limit: int
    window: float
    hits: dict
    lock: threading.Lock

    def allow(self, key: str) -> bool:
        now = time.time()
        with self.lock:
            q = self.hits.setdefault(key, deque())
            while q and q[0] <= now - self.window:
                q.popleft()
            if len(q) >= self.limit:
                return False
            q.append(now)
            if len(self.hits) > 4096:
                stale = [k for k, v in self.hits.items() if not v or v[-1] <= now - self.window * 4]
                for k in stale:
                    del self.hits[k]
            return True


class Limiters:
    def __init__(self, analyze: Limiter, chat: Limiter, test: Limiter):
        self.analyze = analyze
        self.chat = chat
        self.test = test


def create_limiters(cfg) -> Limiters:
    return Limiters(
        analyze=Limiter(cfg.analyze_per_hour, 3600.0, {}, threading.Lock()),
        chat=Limiter(cfg.chat_per_10min, 600.0, {}, threading.Lock()),
        test=Limiter(cfg.test_per_min, 60.0, {}, threading.Lock()),
    )
