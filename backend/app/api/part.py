from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.schemas.part import PartCreate, PartResponse
from app.crud import part as crud_part
from app.core.database import get_db

router = APIRouter(
    prefix="/parts",
    tags=["Parts"]
)

@router.get("/", response_model=List[PartResponse])
def list_parts(db: Session = Depends(get_db)):
    """Get all parts"""
    return crud_part.get_parts(db)

@router.post("/", response_model=PartResponse)
def add_part(part: PartCreate, db: Session = Depends(get_db)):
    """Add a new part"""
    if crud_part.get_part(db, part.id):
        raise HTTPException(status_code=400, detail="Part ID already exists")
    return crud_part.create_part(db, part)