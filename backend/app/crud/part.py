from sqlalchemy.orm import Session
from app.models.part import Part
from app.schemas.part import PartCreate

def get_parts(db: Session):
    return db.query(Part).all()

def get_part(db: Session, part_id: str):
    return db.query(Part).filter(Part.id == part_id).first()

def create_part(db: Session, part: PartCreate):
    db_part = Part(**part.dict())
    db.add(db_part)
    db.commit()
    db.refresh(db_part)
    return db_part