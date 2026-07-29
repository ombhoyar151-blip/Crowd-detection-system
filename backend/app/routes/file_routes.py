"""Static file serving for annotated detection images."""
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.config import DATA_DIR

router = APIRouter(prefix="/api/files", tags=["files"])

UPLOAD_DIR = DATA_DIR / "uploads"


@router.get("/{filename}")
def get_file(filename: str):
    safe = Path(filename).name
    filepath = UPLOAD_DIR / safe
    if not filepath.exists() or not filepath.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(str(filepath), media_type="image/jpeg")
