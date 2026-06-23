from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from bson import ObjectId
from datetime import datetime
import aiofiles
import os
import uuid
import mimetypes

from database import get_db
from utils.auth import get_current_user, require_admin, format_user
from models.user import ProfileUpdate

router = APIRouter(prefix="/users", tags=["Users"])

UPLOAD_DIR = "uploads"
ALLOWED_IMAGE = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_CERT = {"image/jpeg", "image/png", "image/pdf", "application/pdf"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def safe_filename(original: str) -> str:
    ext = os.path.splitext(original)[1].lower()
    return f"{uuid.uuid4().hex}{ext}"


# ── My Profile ───────────────────────────────────────────────────────────────
@router.get("/me")
async def get_my_profile(current_user=Depends(get_current_user)):
    return format_user(current_user)


@router.put("/me")
async def update_my_profile(
    data: ProfileUpdate, current_user=Depends(get_current_user)
):
    db = get_db()
    updates = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if "social_links" in updates and updates["social_links"]:
        updates["social_links"] = {
            k: v for k, v in updates["social_links"].items() if v is not None
        }
    if updates:
        await db.users.update_one(
            {"_id": current_user["_id"]}, {"$set": updates}
        )
    updated = await db.users.find_one({"_id": current_user["_id"]})
    return format_user(updated)


# ── Profile Photo Upload ──────────────────────────────────────────────────────
@router.post("/me/photo")
async def upload_profile_photo(
    file: UploadFile = File(...), current_user=Depends(get_current_user)
):
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(400, "File too large (max 5 MB)")

    mime = mimetypes.guess_type(file.filename)[0] or file.content_type
    if mime not in ALLOWED_IMAGE:
        raise HTTPException(400, "Only JPEG, PNG, GIF, WebP allowed for photos")

    filename = safe_filename(file.filename)
    path = os.path.join(UPLOAD_DIR, "profiles", filename)
    os.makedirs(os.path.dirname(path), exist_ok=True)

    async with aiofiles.open(path, "wb") as f:
        await f.write(content)

    # Delete old photo
    db = get_db()
    old = current_user.get("profile_photo")
    if old:
        old_path = old.lstrip("/")
        if os.path.exists(old_path):
            os.remove(old_path)

    url = f"/uploads/profiles/{filename}"
    await db.users.update_one(
        {"_id": current_user["_id"]}, {"$set": {"profile_photo": url}}
    )
    return {"profile_photo": url}


# ── Certificate Upload ────────────────────────────────────────────────────────
@router.post("/me/certificates")
async def upload_certificate(
    file: UploadFile = File(...), current_user=Depends(get_current_user)
):
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(400, "File too large (max 5 MB)")

    mime = mimetypes.guess_type(file.filename)[0] or file.content_type
    if mime not in ALLOWED_CERT:
        raise HTTPException(400, "Only JPEG, PNG, PDF allowed for certificates")

    filename = safe_filename(file.filename)
    original_name = file.filename
    path = os.path.join(UPLOAD_DIR, "certificates", filename)
    os.makedirs(os.path.dirname(path), exist_ok=True)

    async with aiofiles.open(path, "wb") as f:
        await f.write(content)

    url = f"/uploads/certificates/{filename}"
    db = get_db()
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$push": {"certificates": {"url": url, "name": original_name, "uploaded_at": datetime.utcnow().isoformat()}}},
    )
    updated = await db.users.find_one({"_id": current_user["_id"]})
    return {"certificates": updated.get("certificates", []), "url": url}


@router.delete("/me/certificates/{cert_index}")
async def delete_certificate(cert_index: int, current_user=Depends(get_current_user)):
    db = get_db()
    certs = current_user.get("certificates", [])
    if cert_index < 0 or cert_index >= len(certs):
        raise HTTPException(404, "Certificate not found")

    cert = certs[cert_index]
    cert_url = cert["url"] if isinstance(cert, dict) else cert
    file_path = cert_url.lstrip("/")
    if os.path.exists(file_path):
        os.remove(file_path)

    certs.pop(cert_index)
    await db.users.update_one(
        {"_id": current_user["_id"]}, {"$set": {"certificates": certs}}
    )
    return {"message": "Certificate deleted", "certificates": certs}


# ── Admin: All Users ──────────────────────────────────────────────────────────
@router.get("/")
async def list_users(admin=Depends(require_admin)):
    db = get_db()
    users = await db.users.find({}).to_list(length=1000)
    return [format_user(u) for u in users]


@router.get("/{user_id}")
async def get_user(user_id: str, admin=Depends(require_admin)):
    db = get_db()
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(400, "Invalid user ID")
    if not user:
        raise HTTPException(404, "User not found")
    return format_user(user)


@router.put("/{user_id}/status")
async def update_user_status(
    user_id: str, payload: dict, admin=Depends(require_admin)
):
    action = payload.get("action")
    if action not in ("approve", "reject"):
        raise HTTPException(400, "Action must be 'approve' or 'reject'")

    db = get_db()
    updates = {
        "status": "approved" if action == "approve" else "rejected",
        "approved_at": datetime.utcnow() if action == "approve" else None,
    }
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)}, {"$set": updates}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "User not found")
    updated = await db.users.find_one({"_id": ObjectId(user_id)})
    return format_user(updated)


@router.put("/{user_id}/role")
async def change_user_role(
    user_id: str, payload: dict, admin=Depends(require_admin)
):
    role = payload.get("role")
    if role not in ("admin", "employee", "worker"):
        raise HTTPException(400, "Invalid role")

    db = get_db()
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"role": role}})
    updated = await db.users.find_one({"_id": ObjectId(user_id)})
    return format_user(updated)


@router.delete("/{user_id}")
async def delete_user(user_id: str, admin=Depends(require_admin)):
    db = get_db()
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(400, "Invalid user ID")
    if not user:
        raise HTTPException(404, "User not found")

    # Remove uploaded files
    if user.get("profile_photo"):
        path = user["profile_photo"].lstrip("/")
        if os.path.exists(path):
            os.remove(path)
    for cert in user.get("certificates", []):
        cert_url = cert["url"] if isinstance(cert, dict) else cert
        path = cert_url.lstrip("/")
        if os.path.exists(path):
            os.remove(path)

    await db.users.delete_one({"_id": ObjectId(user_id)})
    return {"message": "User deleted successfully"}
