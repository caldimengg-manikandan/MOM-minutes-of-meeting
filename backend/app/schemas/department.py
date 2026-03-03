from pydantic import BaseModel

class DepartmentBase(BaseModel):
    name: str
    head: str
    employees: int = 0
    budget: float = 0.0
    status: str = "Active"
    location: str | None = None

class DepartmentCreate(BaseModel):
    name: str
    head: str
    budget: float = 0.0
    location: str | None = None

class DepartmentResponse(DepartmentBase):
    id: int

    class Config:
        orm_mode = True