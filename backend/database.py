import sqlite3
from pathlib import Path

# Database file will be created inside backend/
import tempfile
DATABASE_PATH = Path(tempfile.gettempdir()) / "retinaai.db"


def get_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_database():
    conn = get_connection()
    cursor = conn.cursor()

    # -------------------------
    # USERS / ADMIN
    # -------------------------
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'admin',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # -------------------------
    # PATIENTS
    # -------------------------
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            age INTEGER,
            gender TEXT,
            phone TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # -------------------------
    # SCREENINGS
    # -------------------------
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS screenings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT NOT NULL,
            image_path TEXT,
            grade INTEGER,
            diagnosis TEXT,
            confidence REAL,
            referable_probability REAL,
            referable INTEGER,
            gradcam_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (patient_id)
            REFERENCES patients(patient_id)
        )
    """)

    conn.commit()
    conn.close()

print("RetinaAI database initialized successfully!")
print(f"Database: {DATABASE_PATH}")


if __name__ == "__main__":
    init_database()