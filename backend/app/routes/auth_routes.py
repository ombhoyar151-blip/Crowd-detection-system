"""Authentication routes: signup and login."""
import sqlite3
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status

from app.auth import create_access_token, generate_id, hash_password, verify_password
from app.database import get_connection
from app.schemas import AuthResponse, LoginRequest, SignupRequest, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse)
def signup(req: SignupRequest):
    conn = get_connection()
    try:
        existing = conn.execute(
            "SELECT id FROM users WHERE email = ?", (req.email,)
        ).fetchone()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )
        user_id = generate_id()
        created_at = datetime.now(timezone.utc).isoformat()
        conn.execute(
            "INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
            (user_id, req.email, req.name, hash_password(req.password), created_at),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    finally:
        conn.close()

    token = create_access_token({"sub": user_id, "email": req.email})
    user = UserResponse(id=user_id, email=req.email, name=req.name, createdAt=created_at)
    return AuthResponse(token=token, user=user)


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT id, email, name, password_hash, created_at FROM users WHERE email = ?",
            (req.email,),
        ).fetchone()
    finally:
        conn.close()

    if row is None or not verify_password(req.password, row["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token({"sub": row["id"], "email": row["email"]})
    user = UserResponse(
        id=row["id"],
        email=row["email"],
        name=row["name"],
        createdAt=row["created_at"],
    )
    return AuthResponse(token=token, user=user)
