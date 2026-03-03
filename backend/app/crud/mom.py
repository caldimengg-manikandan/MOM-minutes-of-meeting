from sqlalchemy.orm import Session
from app.models.mom import MOM
from app.schemas.mom import MOMCreate


def create_mom(db: Session, data: MOMCreate):
    mom = MOM(**data.dict())
    db.add(mom)
    db.commit()
    db.refresh(mom)
    return mom


def get_all_mom(db: Session):
    return db.query(MOM).order_by(MOM.created_at.desc()).all()
