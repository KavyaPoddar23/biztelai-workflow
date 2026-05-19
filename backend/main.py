from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
import os
import uuid
import shutil
import json
from datetime import datetime
from database import init_db, get_db
from extractor import extract_data_from_image
from validator import validate_all_records, validate_record
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="BiztelAI Workflow API")

# Allow React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Serve uploaded files as static files
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Initialize database on startup
@app.on_event("startup")
def startup():
    init_db()
    os.makedirs("uploads", exist_ok=True)

# Health check
@app.get("/")
def root():
    return {"message": "BiztelAI API is running"}

# ─── UPLOAD ENDPOINTS ───────────────────────────────────────────

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Only allow images and PDFs
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG, and PDF files are allowed"
        )
    
    # Create a unique filename so files don't overwrite each other
    ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = f"uploads/{unique_filename}"
    
    # Save file to disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Save record to database
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO uploads (filename, original_name, file_path)
        VALUES (?, ?, ?)
    """, (unique_filename, file.filename, file_path))
    conn.commit()
    upload_id = cursor.lastrowid
    conn.close()
    
    return {
        "id": upload_id,
        "filename": unique_filename,
        "original_name": file.filename,
        "file_url": f"http://localhost:8000/uploads/{unique_filename}",
        "uploaded_at": datetime.now().isoformat(),
        "message": "File uploaded successfully"
    }


@app.get("/uploads")
def get_uploads():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, filename, original_name, file_path, uploaded_at, status
        FROM uploads
        ORDER BY uploaded_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    
    uploads = []
    for row in rows:
        uploads.append({
            "id": row["id"],
            "filename": row["filename"],
            "original_name": row["original_name"],
            "file_url": f"http://localhost:8000/uploads/{row['filename']}",
            "uploaded_at": row["uploaded_at"],
            "status": row["status"]
        })
    
    return uploads


@app.get("/uploads/{upload_id}")
def get_upload(upload_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM uploads WHERE id = ?", (upload_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    return {
        "id": row["id"],
        "filename": row["filename"],
        "original_name": row["original_name"],
        "file_url": f"http://localhost:8000/uploads/{row['filename']}",
        "uploaded_at": row["uploaded_at"],
        "status": row["status"]
    }

# ─── EXTRACTION ENDPOINTS ────────────────────────────────────────

@app.post("/extract/{upload_id}")
def extract_data(upload_id: int):
    # Get the upload record
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM uploads WHERE id = ?", (upload_id,))
    upload = cursor.fetchone()
    conn.close()

    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    file_path = upload["file_path"]
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    # Run AI extraction
    result = extract_data_from_image(file_path)

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["error"])

    # Get existing work orders to check for duplicates
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT work_order_no FROM records")
    existing_wo = [r["work_order_no"] for r in cursor.fetchall() if r["work_order_no"]]

    # Validate extracted rows
    validated_rows = validate_all_records(result["rows"], existing_wo)

    # Save each row to database
    saved_ids = []
    for row in validated_rows:
        cursor.execute("""
            INSERT INTO records 
            (upload_id, date, shift, emp_no, opn_code, machine_no, 
             work_order_no, qty_produced, time_taken, confidence_scores, validation_errors)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            upload_id,
            row.get("date"),
            row.get("shift"),
            row.get("emp_no"),
            row.get("opn_code"),
            row.get("machine_no"),
            row.get("work_order_no"),
            row.get("qty_produced"),
            row.get("time_taken"),
            json.dumps(row.get("confidence", {})),
            json.dumps(row.get("validation_errors", []))
        ))
        saved_ids.append(cursor.lastrowid)

    # Update upload status
    cursor.execute(
        "UPDATE uploads SET status = 'extracted' WHERE id = ?",
        (upload_id,)
    )
    conn.commit()
    conn.close()

    return {
        "upload_id": upload_id,
        "total_rows": len(validated_rows),
        "rows": validated_rows,
        "message": f"Successfully extracted {len(validated_rows)} rows"
    }


@app.get("/records")
def get_records(upload_id: Optional[int] = None, shift: Optional[str] = None,
                machine_no: Optional[str] = None, date: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()

    query = "SELECT * FROM records WHERE 1=1"
    params = []

    if upload_id:
        query += " AND upload_id = ?"
        params.append(upload_id)
    if shift:
        query += " AND shift = ?"
        params.append(shift)
    if machine_no:
        query += " AND machine_no = ?"
        params.append(machine_no)
    if date:
        query += " AND date = ?"
        params.append(date)

    query += " ORDER BY created_at DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    records = []
    for row in rows:
        records.append({
            "id": row["id"],
            "upload_id": row["upload_id"],
            "date": row["date"],
            "shift": row["shift"],
            "emp_no": row["emp_no"],
            "opn_code": row["opn_code"],
            "machine_no": row["machine_no"],
            "work_order_no": row["work_order_no"],
            "qty_produced": row["qty_produced"],
            "time_taken": row["time_taken"],
            "confidence_scores": json.loads(row["confidence_scores"] or "{}"),
            "validation_errors": json.loads(row["validation_errors"] or "[]"),
            "is_reviewed": row["is_reviewed"],
            "created_at": row["created_at"]
        })

    return records


class RecordUpdate(BaseModel):
    date: Optional[str] = None
    shift: Optional[str] = None
    emp_no: Optional[str] = None
    opn_code: Optional[str] = None
    machine_no: Optional[str] = None
    work_order_no: Optional[str] = None
    qty_produced: Optional[str] = None
    time_taken: Optional[str] = None


@app.put("/records/{record_id}")
def update_record(record_id: int, data: RecordUpdate):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM records WHERE id = ?", (record_id,))
    existing = cursor.fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Record not found")

    # Merge new data with existing
    updated = {
        "date": data.date or existing["date"],
        "shift": data.shift or existing["shift"],
        "emp_no": data.emp_no or existing["emp_no"],
        "opn_code": data.opn_code or existing["opn_code"],
        "machine_no": data.machine_no or existing["machine_no"],
        "work_order_no": data.work_order_no or existing["work_order_no"],
        "qty_produced": data.qty_produced or existing["qty_produced"],
        "time_taken": data.time_taken or existing["time_taken"],
    }

    # Re-run validation on updated data
    new_errors = validate_record(updated)

    cursor.execute("""
        UPDATE records SET
            date = ?, shift = ?, emp_no = ?, opn_code = ?,
            machine_no = ?, work_order_no = ?, qty_produced = ?,
            time_taken = ?, validation_errors = ?, is_reviewed = 1
        WHERE id = ?
    """, (
        updated["date"], updated["shift"], updated["emp_no"],
        updated["opn_code"], updated["machine_no"], updated["work_order_no"],
        updated["qty_produced"], updated["time_taken"],
        json.dumps(new_errors), record_id
    ))
    conn.commit()
    conn.close()

    return {
        "id": record_id,
        **updated,
        "validation_errors": new_errors,
        "is_reviewed": True,
        "message": "Record updated successfully"
    }

# ─── ANALYTICS ENDPOINTS ────────────────────────────────────────

@app.get("/analytics")
def get_analytics():
    conn = get_db()
    cursor = conn.cursor()

    # Total uploads
    cursor.execute("SELECT COUNT(*) as count FROM uploads")
    total_uploads = cursor.fetchone()["count"]

    # Total records
    cursor.execute("SELECT COUNT(*) as count FROM records")
    total_records = cursor.fetchone()["count"]

    # Reviewed records
    cursor.execute("SELECT COUNT(*) as count FROM records WHERE is_reviewed = 1")
    reviewed_records = cursor.fetchone()["count"]

    # Records with validation errors
    cursor.execute("SELECT COUNT(*) as count FROM records WHERE validation_errors != '[]' AND validation_errors != ''")
    validation_failures = cursor.fetchone()["count"]

    # Records needing review (have errors and not reviewed)
    cursor.execute("SELECT COUNT(*) as count FROM records WHERE validation_errors != '[]' AND is_reviewed = 0")
    needs_review = cursor.fetchone()["count"]

    # Shift wise summary
    cursor.execute("""
        SELECT 
            shift,
            COUNT(*) as record_count,
            SUM(CASE WHEN qty_produced NOT IN ('null', '', '-') 
                AND qty_produced IS NOT NULL 
                THEN CAST(qty_produced AS FLOAT) ELSE 0 END) as total_qty,
            AVG(CASE WHEN time_taken NOT IN ('null', '', '-') 
                AND time_taken IS NOT NULL 
                THEN CAST(time_taken AS FLOAT) ELSE NULL END) as avg_time
        FROM records
        WHERE shift IS NOT NULL AND shift != ''
        GROUP BY shift
        ORDER BY shift
    """)
    shift_summary = []
    for row in cursor.fetchall():
        shift_summary.append({
            "shift": row["shift"],
            "record_count": row["record_count"],
            "total_qty": round(row["total_qty"] or 0, 1),
            "avg_time": round(row["avg_time"] or 0, 2)
        })

    # Machine wise summary
    cursor.execute("""
        SELECT 
            machine_no,
            COUNT(*) as record_count,
            SUM(CASE WHEN qty_produced NOT IN ('null', '', '-') 
                AND qty_produced IS NOT NULL 
                THEN CAST(qty_produced AS FLOAT) ELSE 0 END) as total_qty,
            AVG(CASE WHEN time_taken NOT IN ('null', '', '-') 
                AND time_taken IS NOT NULL 
                THEN CAST(time_taken AS FLOAT) ELSE NULL END) as avg_time
        FROM records
        WHERE machine_no IS NOT NULL AND machine_no != ''
        GROUP BY machine_no
        ORDER BY total_qty DESC
    """)
    machine_summary = []
    for row in cursor.fetchall():
        machine_summary.append({
            "machine_no": row["machine_no"],
            "record_count": row["record_count"],
            "total_qty": round(row["total_qty"] or 0, 1),
            "avg_time": round(row["avg_time"] or 0, 2)
        })

    # Employee wise summary
    cursor.execute("""
        SELECT 
            emp_no,
            COUNT(*) as record_count,
            SUM(CASE WHEN qty_produced NOT IN ('null', '', '-') 
                AND qty_produced IS NOT NULL 
                THEN CAST(qty_produced AS FLOAT) ELSE 0 END) as total_qty
        FROM records
        WHERE emp_no IS NOT NULL AND emp_no != ''
        GROUP BY emp_no
        ORDER BY total_qty DESC
        LIMIT 10
    """)
    employee_summary = []
    for row in cursor.fetchall():
        employee_summary.append({
            "emp_no": row["emp_no"],
            "record_count": row["record_count"],
            "total_qty": round(row["total_qty"] or 0, 1)
        })

    # Recent uploads with status
    cursor.execute("""
        SELECT id, original_name, uploaded_at, status
        FROM uploads
        ORDER BY uploaded_at DESC
        LIMIT 5
    """)
    recent_uploads = []
    for row in cursor.fetchall():
        recent_uploads.append({
            "id": row["id"],
            "original_name": row["original_name"],
            "uploaded_at": row["uploaded_at"],
            "status": row["status"]
        })

    # Daily production trend
    cursor.execute("""
        SELECT 
            date,
            COUNT(*) as record_count,
            SUM(CASE WHEN qty_produced NOT IN ('null', '', '-') 
                AND qty_produced IS NOT NULL 
                THEN CAST(qty_produced AS FLOAT) ELSE 0 END) as total_qty
        FROM records
        WHERE date IS NOT NULL AND date != ''
        GROUP BY date
        ORDER BY date
    """)
    daily_trend = []
    for row in cursor.fetchall():
        daily_trend.append({
            "date": row["date"],
            "record_count": row["record_count"],
            "total_qty": round(row["total_qty"] or 0, 1)
        })

    conn.close()

    return {
        "overview": {
            "total_uploads": total_uploads,
            "total_records": total_records,
            "reviewed_records": reviewed_records,
            "validation_failures": validation_failures,
            "needs_review": needs_review
        },
        "shift_summary": shift_summary,
        "machine_summary": machine_summary,
        "employee_summary": employee_summary,
        "recent_uploads": recent_uploads,
        "daily_trend": daily_trend
    }

# ─── SEARCH ENDPOINTS ────────────────────────────────────────────

@app.get("/search")
def search_records(
    query: Optional[str] = None,
    shift: Optional[str] = None,
    machine_no: Optional[str] = None,
    date: Optional[str] = None,
    emp_no: Optional[str] = None,
    needs_review: Optional[bool] = None
):
    conn = get_db()
    cursor = conn.cursor()

    sql = """
        SELECT r.*, u.original_name, u.file_path, u.uploaded_at as upload_date
        FROM records r
        LEFT JOIN uploads u ON r.upload_id = u.id
        WHERE 1=1
    """
    params = []

    if query:
        sql += """ AND (
            r.emp_no LIKE ? OR
            r.machine_no LIKE ? OR
            r.work_order_no LIKE ? OR
            r.opn_code LIKE ? OR
            r.date LIKE ?
        )"""
        q = f"%{query}%"
        params.extend([q, q, q, q, q])

    if shift:
        sql += " AND r.shift = ?"
        params.append(shift)

    if machine_no:
        sql += " AND r.machine_no LIKE ?"
        params.append(f"%{machine_no}%")

    if date:
        sql += " AND r.date LIKE ?"
        params.append(f"%{date}%")

    if emp_no:
        sql += " AND r.emp_no LIKE ?"
        params.append(f"%{emp_no}%")

    if needs_review is not None:
        if needs_review:
            sql += " AND r.validation_errors != '[]' AND r.is_reviewed = 0"
        else:
            sql += " AND (r.validation_errors = '[]' OR r.is_reviewed = 1)"

    sql += " ORDER BY r.created_at DESC"

    cursor.execute(sql, params)
    rows = cursor.fetchall()
    conn.close()

    results = []
    for row in rows:
        results.append({
            "id": row["id"],
            "upload_id": row["upload_id"],
            "original_name": row["original_name"],
            "date": row["date"],
            "shift": row["shift"],
            "emp_no": row["emp_no"],
            "opn_code": row["opn_code"],
            "machine_no": row["machine_no"],
            "work_order_no": row["work_order_no"],
            "qty_produced": row["qty_produced"],
            "time_taken": row["time_taken"],
            "confidence_scores": json.loads(row["confidence_scores"] or "{}"),
            "validation_errors": json.loads(row["validation_errors"] or "[]"),
            "is_reviewed": row["is_reviewed"],
            "created_at": row["created_at"],
            "upload_date": row["upload_date"]
        })

    return {
        "total": len(results),
        "results": results
    }