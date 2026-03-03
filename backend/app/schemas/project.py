from pydantic import BaseModel

class ProjectBase(BaseModel):
    name: str
    manager: str
    status: str = "Planning"
    budget: float = 0.0
    timeline: str | None = None

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int

    class Config:
        orm_mode = True