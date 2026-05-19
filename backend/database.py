import sqlite3
import os

DB_PATH = "biztelai.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Table to store uploaded files
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS uploads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            original_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'uploaded'
        )
    """)
    
    # Table to store extracted records
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            upload_id INTEGER,
            date TEXT,
            shift TEXT,
            emp_no TEXT,
            opn_code TEXT,
            machine_no TEXT,
            work_order_no TEXT,
            qty_produced TEXT,
            time_taken TEXT,
            confidence_scores TEXT,
            validation_errors TEXT,
            is_reviewed INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (upload_id) REFERENCES uploads(id)
        )
    """)
    
    conn.commit()
    conn.close()
    print("Database initialized successfully")