import random
import string
from datetime import datetime, timedelta
from database import get_db
from config import settings


def generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


async def store_otp(identifier: str, otp: str, otp_type: str = "email"):
    db = get_db()
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    await db.otps.delete_many({"identifier": identifier, "type": otp_type})
    await db.otps.insert_one({
        "identifier": identifier,
        "otp": otp,
        "type": otp_type,
        "expires_at": expires_at,
        "created_at": datetime.utcnow(),
    })


async def verify_otp(identifier: str, otp: str, otp_type: str = "email") -> bool:
    db = get_db()
    record = await db.otps.find_one({
        "identifier": identifier,
        "type": otp_type,
        "expires_at": {"$gt": datetime.utcnow()},
    })
    if not record:
        return False
    if record["otp"] != otp:
        return False
    await db.otps.delete_one({"_id": record["_id"]})
    return True


async def send_email_otp(email: str, otp: str) -> bool:
    """Send OTP via SendGrid. Falls back to console log in dev."""
    if settings.SENDGRID_API_KEY:
        try:
            import sendgrid
            from sendgrid.helpers.mail import Mail
            sg = sendgrid.SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
            message = Mail(
                from_email=settings.FROM_EMAIL,
                to_emails=email,
                subject="Your EmpPortal Login OTP",
                html_content=f"""
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;
                     background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
                  <h2 style="color:#1e293b;margin-bottom:8px;">Your One-Time Password</h2>
                  <p style="color:#64748b;">Use this OTP to log in to EmpPortal. It expires in <b>5 minutes</b>.</p>
                  <div style="font-size:40px;font-weight:700;letter-spacing:12px;
                       color:#4f46e5;text-align:center;padding:24px;
                       background:#fff;border-radius:8px;margin:20px 0;">
                    {otp}
                  </div>
                  <p style="color:#94a3b8;font-size:13px;">If you didn't request this, ignore this email.</p>
                </div>
                """,
            )
            sg.send(message)
            return True
        except Exception as e:
            print(f"SendGrid error: {e}")
    # Dev fallback
    print(f"\n{'='*40}\n📧 EMAIL OTP for {email}: {otp}\n{'='*40}\n")
    return True


async def send_sms_otp(phone: str, otp: str) -> bool:
    """Send OTP via Twilio."""
    if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
        try:
            from twilio.rest import Client
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            client.messages.create(
                body=f"Your EmpPortal OTP is: {otp}. Valid for 5 minutes.",
                from_=settings.TWILIO_PHONE_NUMBER,
                to=phone,
            )
            return True
        except Exception as e:
            print(f"Twilio error: {e}")
    print(f"\n{'='*40}\n📱 SMS OTP for {phone}: {otp}\n{'='*40}\n")
    return True
