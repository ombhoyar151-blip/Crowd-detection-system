"""Pydantic schemas for request and response validation."""
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    createdAt: str


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float
    confidence: float


class DetectionResult(BaseModel):
    id: str
    mode: str
    personCount: int
    density: str
    confidence: float
    processingTimeMs: float
    timestamp: str
    sourceName: str
    annotatedImage: str | None = None
    detections: list[BoundingBox] = []
