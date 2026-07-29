"""Main FastAPI application factory."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import (
    auth_routes,
    dashboard_routes,
    detection_routes,
    file_routes,
    history_routes,
    report_routes,
)

app = FastAPI(
    title=settings.app_name,
    description="AI-powered crowd detection system using YOLOv8. "
    "Supports image, video, and live webcam detection with analytics, "
    "history, and PDF/CSV reporting.",
    version="1.0.0",
)

origins = (
    [o.strip() for o in settings.cors_origins.split(",")]
    if settings.cors_origins
    else ["*"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(detection_routes.router)
app.include_router(history_routes.router)
app.include_router(dashboard_routes.router)
app.include_router(report_routes.router)
app.include_router(file_routes.router)


@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "service": settings.app_name, "version": "1.0.0"}


@app.get("/health", tags=["health"])
def health():
    return {"status": "healthy"}
