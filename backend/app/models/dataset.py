# models/dataset.py
from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.core.database import Base

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    industry = Column(String, nullable=True)
    file_type = Column(String)
    row_count = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)