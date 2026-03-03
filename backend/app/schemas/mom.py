from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class MOMCreate(BaseModel):
    meeting_id: Optional[int] = None
    meeting_title: str
    action_item: str
    owner: str
    criticality: str
    target_date: Optional[datetime]
    
    function_dept: Optional[str] = None
    remainder: Optional[str] = None
    approval_status: Optional[str] = "pending-approval"
    attendees: Optional[str] = None
    status: Optional[str] = "pending"
    nature_of_point: Optional[str] = "discussion"


class MOMUpdate(BaseModel):
    status: Optional[str] = None
    criticality: Optional[str] = None
    meeting_title: Optional[str] = None
    action_item: Optional[str] = None
    owner: Optional[str] = None
    target_date: Optional[datetime] = None
    function_dept: Optional[str] = None
    remainder: Optional[str] = None
    approval_status: Optional[str] = None
    attendees: Optional[str] = None
    nature_of_point: Optional[str] = None


class MOMResponse(BaseModel):
    id: int
    meeting_id: Optional[int]
    meeting_title: str
    action_item: str
    owner: str
    criticality: str
    status: str
    target_date: Optional[datetime]
    created_at: datetime
    
    function_dept: Optional[str]
    remainder: Optional[str]
    approval_status: Optional[str]
    attendees: Optional[str]
    nature_of_point: Optional[str]

    class Config:
        from_attributes = True
