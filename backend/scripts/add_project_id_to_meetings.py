import os
import sys

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import create_engine, text
from app.core.config import DATABASE_URL

def add_column():
    print(f"Connecting to database...")
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        try:
            # Check if column exists (PostgreSQL specific)
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='meetings' AND column_name='project_id'"))
            if result.fetchone():
                print("Column project_id already exists.")
                return

            print("Adding project_id column to meetings table...")
            conn.execute(text("ALTER TABLE meetings ADD COLUMN project_id INTEGER REFERENCES projects(id)"))
            conn.commit()
            print("Column added successfully.")
        except Exception as e:
            print(f"Error: {e}")
            # Fallback for SQLite just in case (though config suggests Postgres)
            if "sqlite" in DATABASE_URL:
                 try:
                    conn.execute(text("ALTER TABLE meetings ADD COLUMN project_id INTEGER REFERENCES projects(id)"))
                    conn.commit()
                    print("Column added successfully (SQLite).")
                 except Exception as e2:
                     print(f"Error (SQLite): {e2}")

if __name__ == "__main__":
    add_column()
