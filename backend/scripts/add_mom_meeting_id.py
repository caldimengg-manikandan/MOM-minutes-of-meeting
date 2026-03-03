import sys
import os
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine

def add_meeting_id_column():
    print("Attempting to add 'meeting_id' column to 'mom_points' table...")
    with engine.connect() as conn:
        try:
            # Check if column exists
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='mom_points' AND column_name='meeting_id'"))
            if result.fetchone():
                print("Column 'meeting_id' already exists.")
            else:
                conn.execute(text("ALTER TABLE mom_points ADD COLUMN meeting_id INTEGER REFERENCES meetings(id)"))
                conn.commit()
                print("Column 'meeting_id' added successfully.")
        except Exception as e:
            print(f"Error adding column: {e}")

if __name__ == "__main__":
    add_meeting_id_column()
