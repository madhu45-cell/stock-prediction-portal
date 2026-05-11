from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime, timedelta
import secrets
from pydantic import BaseModel

from core.database import get_db
from core.security import security
from core.config import config
from models.user import User, UserSession, PasswordResetToken
from schemas.user_schema import UserCreate, ChangePasswordRequest
from schemas.auth_schema import (
    RefreshTokenRequest, ResetPasswordRequest, LogoutRequest
)
from utils.logger import logger
from utils.helpers import get_client_ip, get_user_agent
from utils.email_sender import email_sender

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{config.API_V1_PREFIX}/auth/login", auto_error=False)


# ============ DEPENDENCIES ============

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception
    
    try:
        payload = security.decode_token(token)
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if email is None or token_type != "access":
            raise credentials_exception
    except Exception:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email, User.is_active == True).first()
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


# ============ REGISTER ENDPOINT ============

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Register a new user"""
    
    existing_user = db.query(User).filter(
        or_(User.email == user_data.email, User.username == user_data.username)
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    hashed_password = security.hash_password(user_data.password)
    new_user = User(
        email=user_data.email.lower(),
        username=user_data.username.lower(),
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        is_active=True,
        is_verified=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    logger.info(f"New user registered: {new_user.email}")
    
    return {
        "success": True,
        "message": "Registration successful",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "username": new_user.username,
            "full_name": new_user.full_name,
            "is_active": new_user.is_active,
            "is_verified": new_user.is_verified,
            "created_at": new_user.created_at.isoformat() if new_user.created_at else None
        }
    }


# ============ LOGIN ENDPOINT (Works with Swagger UI) ============

@router.post("/login")
async def login(
    request: Request,
    db: Session = Depends(get_db)
):
    """Login user - Works with Swagger UI (form-data) and JSON requests"""
    
    email = None
    password = None
    
    # Get content type
    content_type = request.headers.get("content-type", "").lower()
    
    try:
        if "application/json" in content_type:
            # Handle JSON request
            body = await request.json()
            email = body.get('email') or body.get('username')
            password = body.get('password')
        else:
            # Handle form data (Swagger UI)
            form_data = await request.form()
            email = form_data.get('username') or form_data.get('email')
            password = form_data.get('password')
    except Exception as e:
        logger.error(f"Error parsing request: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid request format")
    
    # Validate
    if not email:
        raise HTTPException(status_code=400, detail="Email/Username is required")
    
    if not password:
        raise HTTPException(status_code=400, detail="Password is required")
    
    email = email.strip().lower()
    
    # Find user
    user = db.query(User).filter(
        or_(User.email == email, User.username == email),
        User.is_active == True
    ).first()
    
    if not user or not security.verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create tokens
    token_data = {"sub": user.email}
    access_token = security.create_access_token(token_data)
    refresh_token = security.create_refresh_token(token_data)
    
    # Store session
    session = UserSession(
        user_id=user.id,
        session_token=refresh_token,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
        expires_at=datetime.utcnow() + timedelta(days=config.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(session)
    db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": config.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "is_verified": user.is_verified
        }
    }


# ============ SIMPLE JSON LOGIN (For API calls) ============

class SimpleLoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login-json")
async def login_json(
    login_data: SimpleLoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Simple JSON login - Use this for API calls"""
    
    email = login_data.email.strip().lower()
    password = login_data.password
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")
    
    user = db.query(User).filter(
        or_(User.email == email, User.username == email),
        User.is_active == True
    ).first()
    
    if not user or not security.verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user.last_login = datetime.utcnow()
    db.commit()
    
    token_data = {"sub": user.email}
    access_token = security.create_access_token(token_data)
    refresh_token = security.create_refresh_token(token_data)
    
    session = UserSession(
        user_id=user.id,
        session_token=refresh_token,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
        expires_at=datetime.utcnow() + timedelta(days=config.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(session)
    db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": config.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "is_verified": user.is_verified
        }
    }


# ============ REFRESH TOKEN ============

@router.post("/refresh")
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Get new access token using refresh token"""
    
    payload = security.validate_token_type(refresh_data.refresh_token, "refresh")
    email = payload.get("sub")
    
    session = db.query(UserSession).filter(
        UserSession.session_token == refresh_data.refresh_token,
        UserSession.is_revoked == False,
        UserSession.expires_at > datetime.utcnow()
    ).first()
    
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    user = db.query(User).filter(User.email == email, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    new_access_token = security.create_access_token({"sub": user.email})
    
    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "expires_in": config.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


# ============ LOGOUT ============

@router.post("/logout")
async def logout(
    request: Request,
    db: Session = Depends(get_db)
):
    """Logout user - revoke refresh token and clear session"""
    
    try:
        # Try to get refresh token from request body
        body = await request.json()
        refresh_token = body.get('refresh_token')
        
        if refresh_token:
            # Revoke the specific session
            db.query(UserSession).filter(
                UserSession.session_token == refresh_token
            ).update({"is_revoked": True})
            db.commit()
            logger.info(f"Session revoked for token: {refresh_token[:20]}...")
        
        return {
            "success": True, 
            "message": "Logged out successfully. Please clear your local tokens."
        }
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        # Still return success to ensure frontend clears tokens
        return {
            "success": True, 
            "message": "Logged out successfully"
        }

# ============ FORGOT PASSWORD ============

class ForgotPasswordRequest(BaseModel):
    email: str

@router.post("/forgot-password")
async def forgot_password(
    forgot_data: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """Request password reset token"""
    
    email = forgot_data.email.strip().lower()
    
    if not email:
        raise HTTPException(status_code=400, detail="Email required")
    
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        return {"success": True, "message": "If registered, you'll receive a reset link"}
    
    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=24)
    
    # Delete old unused tokens
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.is_used == False
    ).delete()
    
    token_record = PasswordResetToken(
        user_id=user.id,
        token=reset_token,
        expires_at=expires_at
    )
    db.add(token_record)
    db.commit()
    
    # Send email
    email_sender.send_password_reset(user.email, reset_token, user.username)
    
    return {"success": True, "message": "If registered, you'll receive a reset link"}


# ============ RESET PASSWORD ============

@router.post("/reset-password")
async def reset_password(
    reset_data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """Reset password using token"""
    
    token_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == reset_data.token,
        PasswordResetToken.is_used == False,
        PasswordResetToken.expires_at > datetime.utcnow()
    ).first()
    
    if not token_record:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    user = db.query(User).filter(User.id == token_record.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.hashed_password = security.hash_password(reset_data.new_password)
    token_record.is_used = True
    db.query(UserSession).filter(UserSession.user_id == user.id).update({"is_revoked": True})
    db.commit()
    
    return {"success": True, "message": "Password reset successfully"}


# ============ CHANGE PASSWORD ============

@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Change user password (requires authentication)"""
    
    if not security.verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    current_user.hashed_password = security.hash_password(password_data.new_password)
    db.commit()
    
    return {"success": True, "message": "Password changed successfully"}


# ============ GET CURRENT USER ============

@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """Get current authenticated user information"""
    
    return {
        "success": True,
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "username": current_user.username,
            "full_name": current_user.full_name,
            "is_active": current_user.is_active,
            "is_verified": current_user.is_verified,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
            "last_login": current_user.last_login.isoformat() if current_user.last_login else None
        }
    }


# ============ DELETE ACCOUNT (Hard Delete - Removes all data) ============

@router.delete("/me")
async def delete_account(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete user account - Permanently removes user and all related data"""
    
    user_id = current_user.id
    user_email = current_user.email
    
    try:
        # 1. Delete all user sessions
        deleted_sessions = db.query(UserSession).filter(UserSession.user_id == user_id).delete()
        logger.info(f"Deleted {deleted_sessions} sessions for user: {user_email}")
        
        # 2. Delete all password reset tokens
        deleted_tokens = db.query(PasswordResetToken).filter(PasswordResetToken.user_id == user_id).delete()
        logger.info(f"Deleted {deleted_tokens} password reset tokens for user: {user_email}")
        
        # 3. Delete the user
        db.delete(current_user)
        
        # Commit all changes
        db.commit()
        
        logger.info(f"User account permanently deleted: {user_email}")
        
        return {
            "success": True, 
            "message": "Account and all associated data permanently deleted successfully"
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Account deletion error for user {user_email}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Account deletion failed: {str(e)}")


# ============ SOFT DELETE ACCOUNT (Just deactivate) ============

@router.delete("/me/soft")
async def soft_delete_account(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Soft delete account - Just deactivates the account (can be reactivated)"""
    
    current_user.is_active = False
    db.commit()
    
    logger.info(f"User account soft deleted (deactivated): {current_user.email}")
    
    return {
        "success": True, 
        "message": "Account deactivated successfully. Contact support to reactivate."
    }

# ============ GET ALL USERS (ADMIN) ============

@router.get("/users")
async def get_all_users(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get all users (admin only)"""
    
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = db.query(User).offset(skip).limit(limit).all()
    
    return {
        "success": True,
        "count": len(users),
        "users": [
            {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "full_name": user.full_name,
                "is_active": user.is_active,
                "is_superuser": user.is_superuser,
                "created_at": user.created_at.isoformat() if user.created_at else None
            }
            for user in users
        ]
    }
