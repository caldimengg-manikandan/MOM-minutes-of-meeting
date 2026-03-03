import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine, Base
from app.models.meeting import Meeting
from sqlalchemy import inspect, text

def create_table():
    inspector = inspect(engine)
    if not inspector.has_table("meetings"):
        print("Creating 'meetings' table...")
        Meeting.__table__.create(engine)
        print("'meetings' table created successfully.")
    else:
        print("'meetings' table already exists.")
        with engine.connect() as conn:
            try:
                conn.execute(text('ALTER TABLE meetings DROP CONSTRAINT IF EXISTS "meetings_project_id_key"'))
                conn.commit()
                print("Dropped unique constraint 'meetings_project_id_key' on meetings.project_id if it existed.")
            except Exception as e:
                print(f"Could not drop constraint 'meetings_project_id_key': {e}")

if __name__ == "__main__":
    create_table()
