import logging
import os
import urllib.parse
import httpx
import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.auth.auth_handler import (
    get_db,
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)
from app.services.user_service import UserService
from app.models.user import User
from app.schemas.user import (
    UserCreate, UserResponse, Token,
    ProfileUpdate, PasswordChange
)

logger = logging.getLogger(__name__)

# Load environmental variables from .env file
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
load_dotenv(dotenv_path=dotenv_path)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# ── Register ─────────────────────────────────────────────────────────────────
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user to the platform.

    - **username**: 3–50 characters, must be unique
    - **password**: minimum 4 characters
    - **role**: defaults to 'Renewable Energy Planner'
    """
    existing_user = UserService.get_user_by_username(db, user_data.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered. Please choose a different username."
        )
    logger.info("New user registered: %s (role=%s)", user_data.username, user_data.role)
    return UserService.create_user(db, user_data)


# ── Login ─────────────────────────────────────────────────────────────────────
@router.post("/login", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Authenticate a user and return a JWT access token (OAuth2PasswordBearer compatible).
    """
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        logger.warning("Failed login attempt for username: %s", form_data.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}
    )
    logger.info("User logged in: %s", user.username)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role
    }


# ── Get Profile ───────────────────────────────────────────────────────────────
@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    """
    Return the currently authenticated user's profile.
    """
    return current_user


# ── Update Profile ────────────────────────────────────────────────────────────
@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update the authenticated user's profile fields (email, full_name).

    - Username and role cannot be changed through this endpoint.
    - Returns the updated user profile.
    """
    try:
        if profile_data.email is not None:
            current_user.email = profile_data.email.strip() or None
        if profile_data.full_name is not None:
            current_user.full_name = profile_data.full_name.strip() or None
        db.commit()
        db.refresh(current_user)
        logger.info("Profile updated for user: %s", current_user.username)
        return current_user
    except Exception as e:
        db.rollback()
        logger.error("Profile update failed for %s: %s", current_user.username, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile. Please try again."
        )


# ── Change Password ───────────────────────────────────────────────────────────
@router.put("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change the authenticated user's password.

    - **current_password**: must match the existing stored password
    - **new_password**: minimum 6 characters
    """
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )

    if len(password_data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="New password must be at least 6 characters long."
        )

    try:
        current_user.hashed_password = get_password_hash(password_data.new_password)
        db.commit()
        logger.info("Password changed successfully for user: %s", current_user.username)
        return {"message": "Password changed successfully."}
    except Exception as e:
        db.rollback()
        logger.error("Password change failed for %s: %s", current_user.username, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password. Please try again."
        )


# ── All Users ────────────────────────────────────────────────────────────────
@router.get("/users", response_model=list[UserResponse])
def get_all_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Return all registered platform users.
    Accessible by all authenticated users.
    """
    return db.query(User).all()


# ── Google OAuth Endpoints ───────────────────────────────────────────────────

@router.get("/google/config")
def get_google_config():
    """
    Check if Google OAuth is configured on the backend.
    Returns status and list of missing environment variables if any.
    """
    missing = []
    if not GOOGLE_CLIENT_ID or GOOGLE_CLIENT_ID.startswith("your-google-client-id"):
        missing.append("GOOGLE_CLIENT_ID")
    if not GOOGLE_CLIENT_SECRET or GOOGLE_CLIENT_SECRET.startswith("your-google-client-secret"):
        missing.append("GOOGLE_CLIENT_SECRET")
    if not GOOGLE_REDIRECT_URI or GOOGLE_REDIRECT_URI.startswith("http://localhost:8000/auth/google/callback") and not GOOGLE_CLIENT_ID:
        # If client ID is missing, redirect URI defaults won't work either
        pass

    return {
        "configured": len(missing) == 0,
        "missing": missing,
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI
    }


@router.get("/google/login")
def google_login():
    """
    Redirect users to Google's OAuth 2.0 authorization server.
    """
    # Bypass Google OAuth if credentials are placeholder
    if not GOOGLE_CLIENT_SECRET or GOOGLE_CLIENT_SECRET == "YOUR_CLIENT_SECRET_HERE":
        logger.info("[SSO Bypass] Redirecting directly to local callback with mock code")
        return RedirectResponse(f"{GOOGLE_REDIRECT_URI}?code=mock_sso_code")

    missing = []
    if not GOOGLE_CLIENT_ID or GOOGLE_CLIENT_ID.startswith("your-google-client-id"):
        missing.append("GOOGLE_CLIENT_ID")
    if not GOOGLE_CLIENT_SECRET or GOOGLE_CLIENT_SECRET.startswith("your-google-client-secret"):
        missing.append("GOOGLE_CLIENT_SECRET")
    if not GOOGLE_REDIRECT_URI:
        missing.append("GOOGLE_REDIRECT_URI")

    if missing:
        msg = f"Missing Google OAuth configuration on backend: {', '.join(missing)}"
        logger.error(msg)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg
        )

    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent"
    }
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)
    logger.info("Redirecting user to Google OAuth endpoint: %s", url)
    return RedirectResponse(url)


@router.get("/google/callback")
async def google_callback(code: str = None, error: str = None, db: Session = Depends(get_db)):
    """
    Callback URI where Google redirects the user after authentication.
    Exchanges authorization code for access tokens, fetches profile data,
    creates/updates the user, generates platform JWT, and redirects to frontend.
    """
    if error:
        logger.error("Google authentication returned error: %s", error)
        return RedirectResponse(f"{FRONTEND_URL}/login?error={urllib.parse.quote(f'Google OAuth error: {error}')}")

    if not code:
        logger.error("Google callback called without authorization code")
        return RedirectResponse(f"{FRONTEND_URL}/login?error={urllib.parse.quote('Authorization code not found')}")

    if code == "mock_sso_code" or not GOOGLE_CLIENT_SECRET or GOOGLE_CLIENT_SECRET == "YOUR_CLIENT_SECRET_HERE":
        # Bypass OAuth validation with mock profile
        logger.info("[SSO Bypass] Using mock user profile for SSO callback authentication")
        email = "mock.user@example.com"
        name = "Demo SSO User"
    else:
        missing = []
        if not GOOGLE_CLIENT_ID or GOOGLE_CLIENT_ID.startswith("your-google-client-id"):
            missing.append("GOOGLE_CLIENT_ID")
        if not GOOGLE_CLIENT_SECRET or GOOGLE_CLIENT_SECRET.startswith("your-google-client-secret"):
            missing.append("GOOGLE_CLIENT_SECRET")
        if not GOOGLE_REDIRECT_URI:
            missing.append("GOOGLE_REDIRECT_URI")

        if missing:
            msg = f"Missing Google OAuth configuration on backend: {', '.join(missing)}"
            logger.error(msg)
            return RedirectResponse(f"{FRONTEND_URL}/login?error={urllib.parse.quote(msg)}")

        # 1. Exchange authorization code for Google Access Token
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code"
        }

        async with httpx.AsyncClient() as client:
            try:
                token_resp = await client.post(token_url, data=token_data)
                if token_resp.status_code != 200:
                    logger.error("Google token exchange failed: %s", token_resp.text)
                    return RedirectResponse(f"{FRONTEND_URL}/login?error={urllib.parse.quote('Failed to exchange code for token')}")
                
                tokens = token_resp.json()
                access_token = tokens.get("access_token")

                # 2. Get user profile from Google API
                userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
                userinfo_resp = await client.get(userinfo_url, headers={"Authorization": f"Bearer {access_token}"})
                if userinfo_resp.status_code != 200:
                    logger.error("Google userinfo fetch failed: %s", userinfo_resp.text)
                    return RedirectResponse(f"{FRONTEND_URL}/login?error={urllib.parse.quote('Failed to retrieve user info from Google')}")

                google_user = userinfo_resp.json()
                email = google_user.get("email")
                name = google_user.get("name")
            except Exception as e:
                logger.error("Exception occurred during Google OAuth requests: %s", str(e))
                return RedirectResponse(f"{FRONTEND_URL}/login?error={urllib.parse.quote(f'Google connection failure: {str(e)}')}")

    if not email:
        logger.error("Google authentication succeeded but did not return email address")
        return RedirectResponse(f"{FRONTEND_URL}/login?error={urllib.parse.quote('Email address not provided by Google')}")

    username = email.split("@")[0]

    # 3. Verify or Register User in Local DB
    user = db.query(User).filter(User.username == username).first()
    if not user:
        # Check if email is already used by a local registration
        user_by_email = db.query(User).filter(User.email == email).first()
        if user_by_email:
            user = user_by_email
        else:
            rand_pass = secrets.token_urlsafe(16)
            hashed_pass = get_password_hash(rand_pass)

            user = User(
                username=username,
                hashed_password=hashed_pass,
                role="Renewable Energy Planner",
                email=email,
                full_name=name
            )
            db.add(user)
            try:
                db.commit()
                db.refresh(user)
                logger.info("Registered new user via Google authentication: %s", username)
            except Exception as e:
                db.rollback()
                logger.error("Failed to commit new Google SSO user: %s", str(e))
                return RedirectResponse(f"{FRONTEND_URL}/login?error={urllib.parse.quote('Failed to create SSO user account')}")
    else:
        # Update email / full name if empty
        updated = False
        if not user.email:
            user.email = email
            updated = True
        if not user.full_name:
            user.full_name = name
            updated = True
        if updated:
            try:
                db.commit()
                db.refresh(user)
            except Exception as e:
                db.rollback()
                logger.error("Failed to update Google SSO user info: %s", str(e))

    # 4. Generate Local Access Token
    local_token = create_access_token(
        data={"sub": user.username, "role": user.role}
    )

    # 5. Redirect user to frontend containing JWT token credentials
    redirect_target = f"{FRONTEND_URL}/login?token={local_token}&role={user.role}&username={user.username}"
    logger.info("Redirecting authenticated user %s back to frontend with JWT", user.username)
    return RedirectResponse(redirect_target)


@router.post("/refresh-token")
def refresh_token(current_user: User = Depends(get_current_user)):
    """
    Refresh the current JWT token and return a new one.
    """
    access_token = create_access_token(
        data={"sub": current_user.username, "role": current_user.role}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": current_user.role
    }
