from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import DATABASE_URL

# Create engine (SAFE for Supabase transaction pooler)
engine = create_engine(
    DATABASE_URL,
    pool_size=5,          # VERY IMPORTANT
    max_overflow=0,       # VERY IMPORTANT
    pool_pre_ping=True,
    connect_args={
        "sslmode": "require",
        "options": "-c statement_cache_size=0",  # DISABLE prepared statements
    },
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()

# FastAPI dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()