import redis
import hashlib
import json
import os
from functools import wraps

# ── Connection ────────────────────────────────────────────────────────────────
# Redis runs in Docker with port 6379 exposed to host
_redis_client = None

def get_redis():
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = redis.Redis(
                host=os.getenv("REDIS_HOST", "127.0.0.1"),
                port=int(os.getenv("REDIS_PORT", 6379)),
                db=0,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
            )
            _redis_client.ping()
        except Exception as e:
            print(f"[Redis] Connection failed: {e} — running without cache", flush=True)
            _redis_client = None
    return _redis_client


# ── TTL constants (seconds) ───────────────────────────────────────────────────
TTL_JOB_SEARCH   = 600   # 10 min  — job listings change slowly
TTL_CV_CHUNKS    = 300   # 5 min   — CV chunks are stable between uploads
TTL_FIT_SCORE    = 300   # 5 min   — fit score for same JD won't change
TTL_RATE_LIMIT   = 60    # 1 min   — rate limit window


# ── Cache helpers ─────────────────────────────────────────────────────────────

def make_key(*parts) -> str:
    """Build a namespaced Redis key from parts."""
    return ":".join(str(p) for p in parts)


def make_hash_key(text: str) -> str:
    """Short MD5 hash of arbitrary text for use in cache keys."""
    return hashlib.md5(text.encode()).hexdigest()[:12]


def cache_get(key: str):
    """Return parsed JSON value or None on miss/error."""
    r = get_redis()
    if not r:
        return None
    try:
        value = r.get(key)
        return json.loads(value) if value else None
    except Exception as e:
        print(f"[Redis] cache_get error: {e}", flush=True)
        return None


def cache_set(key: str, value, ttl: int) -> bool:
    """Serialize value to JSON and store with TTL. Returns True on success."""
    r = get_redis()
    if not r:
        return False
    try:
        r.setex(key, ttl, json.dumps(value))
        return True
    except Exception as e:
        print(f"[Redis] cache_set error: {e}", flush=True)
        return False


def cache_delete(key: str) -> bool:
    """Delete a cache key. Returns True if deleted."""
    r = get_redis()
    if not r:
        return False
    try:
        r.delete(key)
        return True
    except Exception as e:
        print(f"[Redis] cache_delete error: {e}", flush=True)
        return False


def cache_delete_pattern(pattern: str) -> int:
    """Delete all keys matching a pattern. Returns count deleted."""
    r = get_redis()
    if not r:
        return 0
    try:
        keys = r.keys(pattern)
        if keys:
            return r.delete(*keys)
        return 0
    except Exception as e:
        print(f"[Redis] cache_delete_pattern error: {e}", flush=True)
        return 0


# ── Rate limiting ─────────────────────────────────────────────────────────────

def check_rate_limit(user_id: str, action: str, max_requests: int = 5, window: int = TTL_RATE_LIMIT) -> tuple[bool, int]:
    """
    Cache-aside rate limiter using Redis INCR + EXPIRE.
    
    Returns (allowed: bool, current_count: int).
    
    Pattern:
      key = rate:{action}:{user_id}
      INCR key  →  count
      if count == 1: EXPIRE key window   (set TTL only on first call)
      if count > max_requests: deny
    """
    r = get_redis()
    if not r:
        return True, 0  # If Redis is down, allow request (fail open)

    key = make_key("rate", action, user_id)
    try:
        count = r.incr(key)
        if count == 1:
            r.expire(key, window)
        allowed = count <= max_requests
        return allowed, count
    except Exception as e:
        print(f"[Redis] rate_limit error: {e}", flush=True)
        return True, 0  # Fail open


def get_rate_limit_ttl(user_id: str, action: str) -> int:
    """Return seconds until rate limit resets (for 429 response headers)."""
    r = get_redis()
    if not r:
        return 60
    try:
        key = make_key("rate", action, user_id)
        ttl = r.ttl(key)
        return max(ttl, 0)
    except Exception:
        return 60


# ── Thundering herd protection (mutex lock) ───────────────────────────────────

def acquire_lock(lock_key: str, ttl: int = 10) -> bool:
    """
    Try to acquire a Redis distributed lock using SET NX EX.
    Returns True if lock acquired, False if already locked.
    
    Used to prevent the thundering herd problem:
    when a cache key expires and multiple concurrent requests
    all try to query the DB simultaneously.
    """
    r = get_redis()
    if not r:
        return True  # Fail open — proceed without lock
    try:
        result = r.set(f"lock:{lock_key}", "1", nx=True, ex=ttl)
        return result is True
    except Exception:
        return True


def release_lock(lock_key: str):
    """Release a distributed lock."""
    r = get_redis()
    if not r:
        return
    try:
        r.delete(f"lock:{lock_key}")
    except Exception:
        pass