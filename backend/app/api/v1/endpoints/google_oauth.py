# # File: backend/app/api/v1/endpoints/google_oauth.py
# import os
# import base64
# import hashlib
# import secrets
# import requests as req
# from datetime import datetime, timedelta, timezone
# from fastapi import APIRouter, Depends, Request
# from fastapi.responses import RedirectResponse
# from sqlalchemy.orm import Session
# from app.db.session import get_db
# from app.models.oauth import GoogleOAuthToken
# from app.utils.logger import logger

# os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

# router = APIRouter()

# SCOPES = [
#     "https://www.googleapis.com/auth/calendar",
#     "https://www.googleapis.com/auth/gmail.compose",
# ]

# CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID")
# CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
# REDIRECT_URI  = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/v1/google/callback")
# FRONTEND_URL  = os.getenv("FRONTEND_URL", "http://localhost:5173")

# # In-memory store for code verifiers (keyed by clerk_user_id)
# _code_verifiers: dict = {}


# def _generate_pkce():
#     """Generate PKCE code verifier and challenge."""
#     code_verifier  = base64.urlsafe_b64encode(secrets.token_bytes(32)).rstrip(b'=').decode('utf-8')
#     code_challenge = base64.urlsafe_b64encode(
#         hashlib.sha256(code_verifier.encode('utf-8')).digest()
#     ).rstrip(b'=').decode('utf-8')
#     return code_verifier, code_challenge


# @router.get("/auth/{clerk_user_id}")
# async def google_auth(clerk_user_id: str, request: Request):
#     """Start Google OAuth flow with PKCE."""
#     code_verifier, code_challenge = _generate_pkce()

#     # Store verifier for use in callback
#     _code_verifiers[clerk_user_id] = code_verifier

#     # Build auth URL manually with PKCE
#     import urllib.parse
#     params = {
#         "client_id":             CLIENT_ID,
#         "redirect_uri":          REDIRECT_URI,
#         "response_type":         "code",
#         "scope":                 " ".join(SCOPES),
#         "access_type":           "offline",
#         "prompt":                "consent",
#         "state":                 clerk_user_id,
#         "code_challenge":        code_challenge,
#         "code_challenge_method": "S256",
#     }
#     auth_url = "https://accounts.google.com/o/oauth2/auth?" + urllib.parse.urlencode(params)

#     logger.info(f"🔐 Google OAuth started for user: {clerk_user_id}")
#     return RedirectResponse(auth_url)


# @router.get("/callback")
# async def google_callback(
#     code:  str,
#     state: str,
#     db:    Session = Depends(get_db)
# ):
#     """Handle Google OAuth callback with PKCE code verifier."""
#     clerk_user_id = state

#     try:
#         # Retrieve stored code verifier
#         code_verifier = _code_verifiers.pop(clerk_user_id, None)

#         if not code_verifier:
#             logger.error(f"No code verifier found for user: {clerk_user_id}")
#             return RedirectResponse(f"{FRONTEND_URL}/content-marketing?google_connected=false")

#         # Exchange code + verifier for tokens
#         token_response = req.post(
#             "https://oauth2.googleapis.com/token",
#             data={
#                 "code":          code,
#                 "client_id":     CLIENT_ID,
#                 "client_secret": CLIENT_SECRET,
#                 "redirect_uri":  REDIRECT_URI,
#                 "grant_type":    "authorization_code",
#                 "code_verifier": code_verifier,
#             }
#         )
#         token_data = token_response.json()

#         if "error" in token_data:
#             logger.error(f"Token exchange error: {token_data}")
#             return RedirectResponse(f"{FRONTEND_URL}/content-marketing?google_connected=false")

#         access_token  = token_data.get("access_token")
#         refresh_token = token_data.get("refresh_token")
#         expires_in    = token_data.get("expires_in", 3600)
#         scope         = token_data.get("scope", "")
#         expiry        = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

#         # Save or update token in DB
#         existing = db.query(GoogleOAuthToken).filter(
#             GoogleOAuthToken.clerk_user_id == clerk_user_id
#         ).first()

#         if existing:
#             existing.access_token  = access_token
#             existing.refresh_token = refresh_token or existing.refresh_token
#             existing.token_expiry  = expiry
#             existing.scope         = scope
#             existing.updated_at    = datetime.utcnow()
#         else:
#             token = GoogleOAuthToken(
#                 clerk_user_id = clerk_user_id,
#                 access_token  = access_token,
#                 refresh_token = refresh_token,
#                 token_expiry  = expiry,
#                 scope         = scope,
#             )
#             db.add(token)

#         db.commit()
#         logger.info(f"✅ Google OAuth tokens saved for user: {clerk_user_id}")
#         return RedirectResponse(f"{FRONTEND_URL}/content-marketing?google_connected=true")

#     except Exception as e:
#         logger.error(f"OAuth callback failed: {e}")
#         return RedirectResponse(f"{FRONTEND_URL}/content-marketing?google_connected=false")


# @router.get("/status/{clerk_user_id}")
# async def google_status(
#     clerk_user_id: str,
#     db: Session = Depends(get_db)
# ):
#     """Check if user has Google connected."""
#     token = db.query(GoogleOAuthToken).filter(
#         GoogleOAuthToken.clerk_user_id == clerk_user_id
#     ).first()

#     if not token:
#         return {"connected": False}

#     if token.token_expiry and token.token_expiry.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
#         refreshed = _refresh_token(token, db)
#         if not refreshed:
#             return {"connected": False, "reason": "token_expired"}

#     return {
#         "connected":  True,
#         "scope":      token.scope,
#         "updated_at": token.updated_at.isoformat()
#     }


# @router.delete("/disconnect/{clerk_user_id}")
# async def google_disconnect(
#     clerk_user_id: str,
#     db: Session = Depends(get_db)
# ):
#     """Disconnect Google account."""
#     token = db.query(GoogleOAuthToken).filter(
#         GoogleOAuthToken.clerk_user_id == clerk_user_id
#     ).first()

#     if token:
#         db.delete(token)
#         db.commit()

#     logger.info(f"🔌 Google disconnected for user: {clerk_user_id}")
#     return {"disconnected": True}


# def get_user_token(clerk_user_id: str, db: Session) -> str | None:
#     """Helper — get valid access token for user."""
#     token = db.query(GoogleOAuthToken).filter(
#         GoogleOAuthToken.clerk_user_id == clerk_user_id
#     ).first()

#     if not token:
#         return None

#     if token.token_expiry and token.token_expiry.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
#         refreshed = _refresh_token(token, db)
#         if not refreshed:
#             return None

#     return token.access_token


# def _refresh_token(token: GoogleOAuthToken, db: Session) -> bool:
#     """Refresh expired access token."""
#     try:
#         if not token.refresh_token:
#             logger.warning(f"No refresh token for user: {token.clerk_user_id}")
#             return False

#         response = req.post(
#             "https://oauth2.googleapis.com/token",
#             data={
#                 "client_id":     CLIENT_ID,
#                 "client_secret": CLIENT_SECRET,
#                 "refresh_token": token.refresh_token,
#                 "grant_type":    "refresh_token",
#             }
#         )
#         data = response.json()

#         if "error" in data:
#             logger.error(f"Token refresh error: {data}")
#             return False

#         token.access_token = data.get("access_token")
#         token.token_expiry = datetime.now(timezone.utc) + timedelta(seconds=data.get("expires_in", 3600))
#         token.updated_at   = datetime.utcnow()
#         db.commit()

#         logger.info(f"✅ Token refreshed for user: {token.clerk_user_id}")
#         return True

#     except Exception as e:
#         logger.error(f"Token refresh failed: {e}")
#         return False

# File: backend/app/api/v1/endpoints/google_oauth.py
import os
import base64
import hashlib
import secrets
import requests as req
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.oauth import GoogleOAuthToken
from app.utils.logger import logger

os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

router = APIRouter()

SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/gmail.compose",
]

CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI  = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/v1/google/callback")
FRONTEND_URL  = os.getenv("FRONTEND_URL", "http://localhost:5173")

# In-memory store for code verifiers (keyed by clerk_user_id)
_code_verifiers: dict = {}


def _generate_pkce():
    code_verifier  = base64.urlsafe_b64encode(secrets.token_bytes(32)).rstrip(b'=').decode('utf-8')
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode('utf-8')).digest()
    ).rstrip(b'=').decode('utf-8')
    return code_verifier, code_challenge


@router.get("/auth/{clerk_user_id}")
async def google_auth(clerk_user_id: str, request: Request, idea_id: str = None, page: str = "content-marketing"):
    """Start Google OAuth flow with PKCE — preserves idea_id and page."""
    code_verifier, code_challenge = _generate_pkce()

    # Store verifier + idea_id + page for callback
    _code_verifiers[clerk_user_id] = {
        "verifier": code_verifier,
        "idea_id":  idea_id or "",
        "page":     page or "content-marketing",
    }

    import urllib.parse
    # Encode idea_id and page into state
    state = f"{clerk_user_id}|{idea_id or ''}|{page or 'content-marketing'}"

    params = {
        "client_id":             CLIENT_ID,
        "redirect_uri":          REDIRECT_URI,
        "response_type":         "code",
        "scope":                 " ".join(SCOPES),
        "access_type":           "offline",
        "prompt":                "consent",
        "state":                 state,
        "code_challenge":        code_challenge,
        "code_challenge_method": "S256",
    }
    auth_url = "https://accounts.google.com/o/oauth2/auth?" + urllib.parse.urlencode(params)
    logger.info(f"🔐 Google OAuth started for user: {clerk_user_id} (idea: {idea_id}, page: {page})")
    return RedirectResponse(auth_url)


@router.get("/callback")
async def google_callback(
    code:  str,
    state: str,
    db:    Session = Depends(get_db)
):
    """Handle Google OAuth callback — preserves idea_id in redirect."""
    # Parse state: clerk_user_id|idea_id|page
    parts         = state.split("|")
    clerk_user_id = parts[0]
    idea_id       = parts[1] if len(parts) > 1 else ""
    page          = parts[2] if len(parts) > 2 else "content-marketing"

    try:
        stored        = _code_verifiers.pop(clerk_user_id, None)
        code_verifier = stored["verifier"] if isinstance(stored, dict) else stored

        if not code_verifier:
            logger.error(f"No code verifier found for user: {clerk_user_id}")
            redirect = f"{FRONTEND_URL}/{page}?google_connected=false"
            if idea_id:
                redirect += f"&ideaId={idea_id}"
            return RedirectResponse(redirect)

        token_response = req.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code":          code,
                "client_id":     CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "redirect_uri":  REDIRECT_URI,
                "grant_type":    "authorization_code",
                "code_verifier": code_verifier,
            }
        )
        token_data = token_response.json()

        if "error" in token_data:
            logger.error(f"Token exchange error: {token_data}")
            redirect = f"{FRONTEND_URL}/{page}?google_connected=false"
            if idea_id:
                redirect += f"&ideaId={idea_id}"
            return RedirectResponse(redirect)

        access_token  = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        expires_in    = token_data.get("expires_in", 3600)
        scope         = token_data.get("scope", "")
        expiry        = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

        existing = db.query(GoogleOAuthToken).filter(
            GoogleOAuthToken.clerk_user_id == clerk_user_id
        ).first()

        if existing:
            existing.access_token  = access_token
            existing.refresh_token = refresh_token or existing.refresh_token
            existing.token_expiry  = expiry
            existing.scope         = scope
            existing.updated_at    = datetime.utcnow()
        else:
            token = GoogleOAuthToken(
                clerk_user_id = clerk_user_id,
                access_token  = access_token,
                refresh_token = refresh_token,
                token_expiry  = expiry,
                scope         = scope,
            )
            db.add(token)

        db.commit()
        logger.info(f"✅ Google OAuth tokens saved for user: {clerk_user_id}")

        # Redirect back with ideaId preserved
        redirect = f"{FRONTEND_URL}/{page}?google_connected=true"
        if idea_id:
            redirect += f"&ideaId={idea_id}"
        return RedirectResponse(redirect)

    except Exception as e:
        logger.error(f"OAuth callback failed: {e}")
        redirect = f"{FRONTEND_URL}/{page}?google_connected=false"
        if idea_id:
            redirect += f"&ideaId={idea_id}"
        return RedirectResponse(redirect)


@router.get("/status/{clerk_user_id}")
async def google_status(clerk_user_id: str, db: Session = Depends(get_db)):
    token = db.query(GoogleOAuthToken).filter(
        GoogleOAuthToken.clerk_user_id == clerk_user_id
    ).first()

    if not token:
        return {"connected": False}

    if token.token_expiry and token.token_expiry.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        refreshed = _refresh_token(token, db)
        if not refreshed:
            return {"connected": False, "reason": "token_expired"}

    return {
        "connected":  True,
        "scope":      token.scope,
        "updated_at": token.updated_at.isoformat()
    }


@router.delete("/disconnect/{clerk_user_id}")
async def google_disconnect(clerk_user_id: str, db: Session = Depends(get_db)):
    token = db.query(GoogleOAuthToken).filter(
        GoogleOAuthToken.clerk_user_id == clerk_user_id
    ).first()

    if token:
        db.delete(token)
        db.commit()

    logger.info(f"🔌 Google disconnected for user: {clerk_user_id}")
    return {"disconnected": True}


def get_user_token(clerk_user_id: str, db: Session) -> str | None:
    token = db.query(GoogleOAuthToken).filter(
        GoogleOAuthToken.clerk_user_id == clerk_user_id
    ).first()

    if not token:
        return None

    if token.token_expiry and token.token_expiry.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        refreshed = _refresh_token(token, db)
        if not refreshed:
            return None

    return token.access_token


def _refresh_token(token: GoogleOAuthToken, db: Session) -> bool:
    try:
        if not token.refresh_token:
            logger.warning(f"No refresh token for user: {token.clerk_user_id}")
            return False

        response = req.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id":     CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "refresh_token": token.refresh_token,
                "grant_type":    "refresh_token",
            }
        )
        data = response.json()

        if "error" in data:
            logger.error(f"Token refresh error: {data}")
            return False

        token.access_token = data.get("access_token")
        token.token_expiry = datetime.now(timezone.utc) + timedelta(seconds=data.get("expires_in", 3600))
        token.updated_at   = datetime.utcnow()
        db.commit()

        logger.info(f"✅ Token refreshed for user: {token.clerk_user_id}")
        return True

    except Exception as e:
        logger.error(f"Token refresh failed: {e}")
        return False