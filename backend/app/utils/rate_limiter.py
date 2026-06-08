from fastapi import HTTPException, Depends
from app.utils.redis_client import check_rate_limit, get_rate_limit_ttl
from app.routes.auth import get_current_user


def make_rate_limiter(action: str, max_requests: int = 5, window: int = 60):
    """
    Factory that returns a FastAPI dependency enforcing rate limits.

    Usage:
        @router.post("/cv")
        async def tailor_cv(
            request: TailorRequest,
            user_id: str = Depends(get_current_user),
            _: None = Depends(make_rate_limiter("tailor_cv", max_requests=3, window=60))
        ):

    The dependency reads user_id from the JWT via get_current_user.
    """
    async def _limiter(user_id: str = Depends(get_current_user)):
        allowed, count = check_rate_limit(user_id, action, max_requests, window)
        if not allowed:
            retry_after = get_rate_limit_ttl(user_id, action)
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Max {max_requests} requests per {window}s. "
                       f"Try again in {retry_after}s.",
                headers={"Retry-After": str(retry_after)},
            )
    return _limiter


# ── Pre-built limiters for each expensive endpoint ────────────────────────────
tailor_cv_limiter     = make_rate_limiter("tailor_cv",     max_requests=5,  window=60)
job_search_limiter    = make_rate_limiter("job_search",    max_requests=10, window=60)
interview_limiter     = make_rate_limiter("interview",     max_requests=5,  window=60)
fit_score_limiter     = make_rate_limiter("fit_score",     max_requests=10, window=60)