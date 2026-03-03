from sqlalchemy import Column, String, Integer, Float
from app.core.database import Base

class Part(Base):
    __tablename__ = "parts"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=True)
    stock = Column(Integer, default=0)
    reorder_level = Column(Integer, default=0)
    price = Column(Float, default=0.0)