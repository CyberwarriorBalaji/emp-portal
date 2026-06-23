from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime


class UserRole(str, Enum):
    ADMIN = "admin"
    EMPLOYEE = "employee"
    WORKER = "worker"


class UserStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class SocialLinks(BaseModel):
    github: Optional[str] = None
    instagram: Optional[str] = None
    linkedin: Optional[str] = None


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.EMPLOYEE
    phone: Optional[str] = None
    department: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class OTPRequest(BaseModel):
    email: EmailStr


class OTPVerify(BaseModel):
    email: EmailStr
    otp: str


class SMSOTPRequest(BaseModel):
    phone: str


class SMSOTPVerify(BaseModel):
    phone: str
    otp: str


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    bio: Optional[str] = None
    social_links: Optional[SocialLinks] = None


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole
    status: UserStatus
    phone: Optional[str] = None
    department: Optional[str] = None
    bio: Optional[str] = None
    profile_photo: Optional[str] = None
    certificates: List[str] = []
    social_links: Optional[SocialLinks] = None
    created_at: datetime
    approved_at: Optional[datetime] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class AdminUserAction(BaseModel):
    action: str  # "approve" or "reject"
