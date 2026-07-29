"""Detection routes: image, video, and webcam frame analysis."""
import time
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.dependencies import get_current_user
from app.detection import run_image_detection, run_video_detection
from app.schemas import DetectionResult

router = APIRouter(prefix="/api/detect", tags=["detection"])


@router.post("/image", response_model=DetectionResult)
async def detect_image(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file")
    return run_image_detection(contents, file.filename or "upload.jpg", user["id"])


@router.post("/video", response_model=DetectionResult)
async def detect_video(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    if not file.content_type or not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video")
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file")
    return run_video_detection(contents, file.filename or "upload.mp4", user["id"])
