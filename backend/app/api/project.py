from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.schemas.project import ProjectCreate, ProjectResponse
from app.crud import project as crud_project
from app.core.database import get_db

router = APIRouter(
    prefix="/projects",
    tags=["Projects"]
)

@router.get("/", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db)):
    return crud_project.get_projects(db)

@router.post("/", response_model=ProjectResponse)
def add_project(project: ProjectCreate, db: Session = Depends(get_db)):
    return crud_project.create_project(db, project)