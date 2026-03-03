from pydantic import BaseModel

class PartBase(BaseModel):
    name: str
    category: str | None = None
    stock: int = 0
    reorder_level: int = 0
    price: float = 0.0

class PartCreate(PartBase):
    id: str

class PartResponse(PartBase):
    id: str

    class Config:
        orm_mode = True
