"""History routes: list, delete, and clear detection records."""
from fastapi import APIRouter, Depends, HTTPException

from app.database import get_connection
from app.dependencies import get_current_user
from app.schemas import BoundingBox, DetectionResult

router = APIRouter(prefix="/api/history", tags=["history"])


def _row_to_result(row, detections=None) -> DetectionResult:
    return DetectionResult(
        id=row["id"],
        mode=row["mode"],
        personCount=row["person_count"],
        density=row["density"],
        confidence=row["confidence"],
        processingTimeMs=row["processing_time_ms"],
        timestamp=row["timestamp"],
        sourceName=row["source_name"],
        annotatedImage=(
            f"/api/files/{row['annotated_image_path'].rsplit('/', 1)[-1]}"
            if row["annotated_image_path"]
            else None
        ),
        detections=detections or [],
    )


@router.get("", response_model=list[DetectionResult])
def list_history(user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM detections WHERE user_id = ? ORDER BY timestamp DESC LIMIT 200",
            (user["id"],),
        ).fetchall()
    finally:
        conn.close()
    return [_row_to_result(r) for r in rows]


@router.delete("/{detection_id}")
def delete_detection(detection_id: str, user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT id FROM detections WHERE id = ? AND user_id = ?",
            (detection_id, user["id"]),
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Detection not found")
        conn.execute("DELETE FROM detections WHERE id = ?", (detection_id,))
        conn.commit()
    finally:
        conn.close()
    return {"status": "deleted"}


@router.delete("")
def clear_history(user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        conn.execute("DELETE FROM detections WHERE user_id = ?", (user["id"],))
        conn.commit()
    finally:
        conn.close()
    return {"status": "cleared"}
