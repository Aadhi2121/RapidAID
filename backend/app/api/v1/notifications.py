from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.models import Notification, User
from app.schemas.schemas import NotificationResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
def get_notifications(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Returns latest notifications with optional user filtering.
    """
    query = db.query(Notification)
    if current_user and current_user.role != "ADMIN":
        query = query.filter(
            (Notification.user_id == current_user.id) | (Notification.user_id == None)
        )
    return query.order_by(desc(Notification.created_at)).limit(limit).all()

@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(notification_id: int, db: Session = Depends(get_db)):
    """Marks a notification as read."""
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.read = True
    db.commit()
    db.refresh(notif)
    return notif

@router.post("/mark-all-read")
def mark_all_read(db: Session = Depends(get_db)):
    """Marks all notifications as read."""
    db.query(Notification).update({Notification.read: True})
    db.commit()
    return {"message": "All notifications marked as read"}
