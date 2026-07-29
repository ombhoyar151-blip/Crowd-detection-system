"""Dashboard stats route: aggregated analytics."""
from fastapi import APIRouter, Depends

from app.database import get_connection
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
def dashboard_stats(user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM detections WHERE user_id = ? ORDER BY timestamp DESC",
            (user["id"],),
        ).fetchall()
    finally:
        conn.close()

    total = len(rows)
    total_persons = sum(r["person_count"] for r in rows)
    avg_conf = sum(r["confidence"] for r in rows) / total if total else 0
    avg_time = sum(r["processing_time_ms"] for r in rows) / total if total else 0

    density = {"Low": 0, "Medium": 0, "High": 0}
    mode = {"image": 0, "video": 0, "webcam": 0}
    for r in rows:
        density[r["density"]] = density.get(r["density"], 0) + 1
        mode[r["mode"]] = mode.get(r["mode"], 0) + 1

    recent = [
        {
            "id": r["id"],
            "mode": r["mode"],
            "personCount": r["person_count"],
            "density": r["density"],
            "confidence": r["confidence"],
            "processingTimeMs": r["processing_time_ms"],
            "timestamp": r["timestamp"],
            "sourceName": r["source_name"],
            "detections": [],
        }
        for r in rows[:6]
    ]

    timeline = [
        {
            "label": r["timestamp"][11:16],
            "count": r["person_count"],
            "density": r["density"],
        }
        for r in reversed(rows)
    ]

    return {
        "totalDetections": total,
        "totalPersons": total_persons,
        "avgConfidence": avg_conf,
        "avgProcessingTime": avg_time,
        "densityBreakdown": density,
        "modeBreakdown": mode,
        "recentDetections": recent,
        "timeline": timeline,
    }
