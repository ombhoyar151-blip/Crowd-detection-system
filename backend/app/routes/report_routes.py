"""Report routes: CSV and PDF export."""
import csv
import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.database import get_connection
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/csv")
def export_csv(user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM detections WHERE user_id = ? ORDER BY timestamp DESC",
            (user["id"],),
        ).fetchall()
    finally:
        conn.close()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        ["id", "timestamp", "mode", "source", "person_count", "density", "confidence", "processing_time_ms"]
    )
    for r in rows:
        writer.writerow(
            [
                r["id"],
                r["timestamp"],
                r["mode"],
                r["source_name"],
                r["person_count"],
                r["density"],
                f"{r['confidence']:.4f}",
                round(r["processing_time_ms"]),
            ]
        )

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=crowdsense_report.csv"},
    )


@router.get("/pdf")
def export_pdf(user: dict = Depends(get_current_user)):
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import (
            SimpleDocTemplate,
            Table,
            TableStyle,
            Paragraph,
            Spacer,
        )
    except ImportError:
        raise HTTPException(status_code=500, detail="reportlab not installed")

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

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "CustomTitle", parent=styles["Title"], fontSize=22, spaceAfter=6
    )
    styles.add(title_style)

    elements = []
    elements.append(Paragraph("CrowdSense Detection Report", styles["CustomTitle"]))
    elements.append(Paragraph(f"Generated for: {user['email']}", styles["Normal"]))
    elements.append(Spacer(1, 20))

    summary_data = [
        ["Metric", "Value"],
        ["Total Detections", str(total)],
        ["Total Persons Detected", str(total_persons)],
        ["Average Confidence", f"{avg_conf * 100:.1f}%"],
    ]
    summary_table = Table(summary_data, colWidths=[200, 200])
    summary_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1c66f5")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f8fafc")),
                ("GRID", (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
            ]
        )
    )
    elements.append(summary_table)
    elements.append(Spacer(1, 24))

    elements.append(Paragraph("Detection Records", styles["Heading2"]))
    elements.append(Spacer(1, 10))

    table_data = [["Time", "Source", "Mode", "Count", "Density", "Confidence"]]
    for r in rows[:50]:
        table_data.append(
            [
                r["timestamp"][:16],
                r["source_name"][:20],
                r["mode"],
                str(r["person_count"]),
                r["density"],
                f"{r['confidence'] * 100:.1f}%",
            ]
        )

    detail_table = Table(table_data, colWidths=[90, 110, 60, 50, 70, 70])
    detail_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1c66f5")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ]
        )
    )
    elements.append(detail_table)

    doc.build(elements)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=crowdsense_report.pdf"},
    )
