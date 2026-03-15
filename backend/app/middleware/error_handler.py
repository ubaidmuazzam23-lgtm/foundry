"""Error Handler Middleware"""
from starlette.requests import Request
from starlette.responses import JSONResponse

async def error_handler_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )
