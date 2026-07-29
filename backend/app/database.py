"""SQLite database initialization using sqlite3."""
import sqlite3
from pathlib import Path

from app.config import DATA_DIR

DB_PATH = DATA_DIR / "crowdsense.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS detections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    mode TEXT NOT NULL,
    source_name TEXT NOT NULL,
    person_count INTEGER NOT NULL,
    density TEXT NOT NULL,
    confidence REAL NOT NULL,
    processing_time_ms REAL NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    annotated_image_path TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_detections_user ON detections(user_id);
CREATE INDEX IF NOT EXISTS idx_detections_timestamp ON detections(timestamp);
"""


def init_db() -> None:
    get_connection().executescript(SCHEMA)


init_db()
