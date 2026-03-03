from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class Criticality(enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class MOM(Base):
    __tablename__ = "mom_points"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=True)
    meeting_title = Column(String(255), nullable=False)
    action_item = Column(Text, nullable=False)
    owner = Column(String(100), nullable=True)
    criticality = Column(Enum(Criticality), default=Criticality.MEDIUM)
    status = Column(String(50), default="open")
    target_date = Column(DateTime, nullable=True)

    # New columns for full frontend support
    function_dept = Column(String(100), nullable=True)
    remainder = Column(String(50), nullable=True)
    approval_status = Column(String(50), default="pending-approval")
    attendees = Column(Text, nullable=True)
    nature_of_point = Column(String(50), default="discussion")

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    meeting = relationship("Meeting", back_populates="moms")
