from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime

class EmployeeBase(BaseModel):
    employee_id: Optional[str] = None
    name: str
    email: EmailStr
    department: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = "Active"
    custom_fields: Optional[Dict[str, Any]] = {}

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(EmployeeBase):
    name: Optional[str] = None
    email: Optional[EmailStr] = None

class EmployeeOut(EmployeeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
