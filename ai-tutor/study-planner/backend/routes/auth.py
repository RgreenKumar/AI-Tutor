import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import User
from security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

MIN_PASSWORD_LENGTH = 8
RESET_TOKEN_TTL_MINUTES = 15


# ---- Schemas ----

class SignupRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# ---- Routes ----

@router.post("/signup")
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    """Create a new user. 409 if the email is already registered."""
    if len(req.password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Password must be at least {MIN_PASSWORD_LENGTH} characters",
        )

    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(email=req.email, password_hash=hash_password(req.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "email": user.email}


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Verify credentials and return a JWT access token."""
    user = db.query(User).filter(User.email == req.email).first()

    # Same error message whether the email or the password is wrong.
    if user is None or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer"}


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generate a 15-minute reset token.

    We have no email server, so the token is returned in the response. In
    production this token would be emailed to the user, never returned here.
    """
    user = db.query(User).filter(User.email == req.email).first()
    if user is None:
        raise HTTPException(status_code=404, detail="No account with that email")

    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_expires = datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_TTL_MINUTES)
    db.commit()

    return {
        "reset_token": token,
        "expires_in_minutes": RESET_TOKEN_TTL_MINUTES,
        "note": "In production this token would be emailed to the user, not returned here.",
    }


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Consume a valid, unexpired reset token and set a new password."""
    if len(req.new_password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Password must be at least {MIN_PASSWORD_LENGTH} characters",
        )

    user = db.query(User).filter(User.reset_token == req.token).first()
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid reset token")

    if user.reset_expires is None or user.reset_expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token has expired")

    user.password_hash = hash_password(req.new_password)
    user.reset_token = None
    user.reset_expires = None
    db.commit()
    return {"message": "Password has been reset"}
