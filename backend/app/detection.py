"""YOLOv8 model loader and detection logic."""
import time
import uuid
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

from app.config import DATA_DIR, settings
from app.schemas import BoundingBox, DetectionResult

_model = None
UPLOAD_DIR = DATA_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


def get_model():
    global _model
    if _model is None:
        from ultralytics import YOLO

        _model = YOLO(settings.model_name)
    return _model


def classify_density(count: int) -> str:
    if count <= settings.low_threshold:
        return "Low"
    if count <= settings.medium_threshold:
        return "Medium"
    return "High"


def boxes_from_result(r, w: int, h: int) -> list[BoundingBox]:
    boxes = []
    if r.boxes is None:
        return boxes
    for box in r.boxes:
        cls = int(box.cls[0])
        if cls != 0:
            continue
        conf = float(box.conf[0])
        if conf < settings.confidence_threshold:
            continue
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        boxes.append(
            BoundingBox(
                x=x1 / w,
                y=y1 / h,
                width=(x2 - x1) / w,
                height=(y2 - y1) / h,
                confidence=conf,
            )
        )
    return boxes


def save_annotated(frame: np.ndarray, results) -> str:
    annotated = results[0].plot()
    filename = f"det_{uuid.uuid4().hex[:12]}.jpg"
    filepath = UPLOAD_DIR / filename
    cv2.imwrite(str(filepath), annotated)
    return str(filepath)


def run_image_detection(
    image_bytes: bytes, source_name: str, user_id: str
) -> DetectionResult:
    start = time.perf_counter()
    model = get_model()

    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")
    h, w = img.shape[:2]

    results = model(img, verbose=False)
    boxes = boxes_from_result(results[0], w, h)
    count = len(boxes)
    avg_conf = sum(b.confidence for b in boxes) / count if count else 0.0
    annotated_path = save_annotated(img, results)

    elapsed_ms = (time.perf_counter() - start) * 1000
    density = classify_density(count)

    detection_id = str(uuid.uuid4())
    _persist_detection(detection_id, user_id, "image", source_name, count, density, avg_conf, elapsed_ms, annotated_path)

    return DetectionResult(
        id=detection_id,
        mode="image",
        personCount=count,
        density=density,
        confidence=avg_conf,
        processingTimeMs=elapsed_ms,
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        sourceName=source_name,
        detections=boxes,
        annotatedImage=f"/api/files/{Path(annotated_path).name}",
    )


def run_video_detection(
    video_bytes: bytes, source_name: str, user_id: str
) -> DetectionResult:
    start = time.perf_counter()
    model = get_model()

    tmp_path = UPLOAD_DIR / f"vid_{uuid.uuid4().hex[:12]}.mp4"
    tmp_path.write_bytes(video_bytes)

    cap = cv2.VideoCapture(str(tmp_path))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    sample_step = max(1, total_frames // 30) if total_frames > 0 else 1

    all_boxes: list[BoundingBox] = []
    all_confidences: list[float] = []
    max_count = 0
    max_frame = None
    max_results = None

    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_idx % sample_step == 0:
            results = model(frame, verbose=False)
            h, w = frame.shape[:2]
            boxes = boxes_from_result(results[0], w, h)
            if len(boxes) > max_count:
                max_count = len(boxes)
                max_frame = frame.copy()
                max_results = results
            all_confidences.extend(b.confidence for b in boxes)
        frame_idx += 1

    cap.release()
    tmp_path.unlink(missing_ok=True)

    if max_frame is not None and max_results is not None:
        annotated_path = save_annotated(max_frame, max_results)
    else:
        annotated_path = ""

    count = max_count
    avg_conf = sum(all_confidences) / len(all_confidences) if all_confidences else 0.0
    elapsed_ms = (time.perf_counter() - start) * 1000
    density = classify_density(count)

    detection_id = str(uuid.uuid4())
    _persist_detection(detection_id, user_id, "video", source_name, count, density, avg_conf, elapsed_ms, annotated_path)

    return DetectionResult(
        id=detection_id,
        mode="video",
        personCount=count,
        density=density,
        confidence=avg_conf,
        processingTimeMs=elapsed_ms,
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        sourceName=source_name,
        detections=[],
        annotatedImage=f"/api/files/{Path(annotated_path).name}" if annotated_path else None,
    )


def _persist_detection(
    detection_id, user_id, mode, source_name, count, density, confidence, elapsed_ms, annotated_path
):
    from app.database import get_connection

    conn = get_connection()
    try:
        conn.execute(
            """INSERT INTO detections
               (id, user_id, mode, source_name, person_count, density, confidence, processing_time_ms, annotated_image_path)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (detection_id, user_id, mode, source_name, count, density, confidence, elapsed_ms, annotated_path),
        )
        conn.commit()
    finally:
        conn.close()
