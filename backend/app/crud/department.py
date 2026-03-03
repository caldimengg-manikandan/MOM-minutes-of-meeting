from sqlalchemy.orm import Session
from app.models.department import Department
from app.schemas.department import DepartmentCreate

def get_departments(db: Session):
    return db.query(Department).all()

def create_department(db: Session, dept: DepartmentCreate):
    db_dept = Department(
        name=dept.name,
        head=dept.head,
        budget=dept.budget,
        location=dept.location,
        employees=0,
        status="Active",
    )
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    return db_dept