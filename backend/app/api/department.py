from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.schemas.department import DepartmentCreate, DepartmentResponse
from app.crud import department as crud_department
from app.core.database import get_db

router = APIRouter(
    prefix="/departments",
    tags=["Departments"]
)

@router.get("/", response_model=List[DepartmentResponse])
def list_departments(db: Session = Depends(get_db)):
    return crud_department.get_departments(db)

@router.post("/", response_model=DepartmentResponse)
def add_department(dept: DepartmentCreate, db: Session = Depends(get_db)):
    return crud_department.create_department(db, dept)