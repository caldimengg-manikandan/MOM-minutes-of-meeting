import sys
import os
from sqlalchemy import text

# Add backend directory to path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine

def add_column():
    print("Attempting to add 'nature_of_point' column to 'mom_points' table...")
    with engine.connect() as conn:
        try:
            # Check if column exists
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='mom_points' AND column_name='nature_of_point'"))
            if result.fetchone():
                print("Column 'nature_of_point' already exists.")
            else:
                conn.execute(text("ALTER TABLE mom_points ADD COLUMN nature_of_point VARCHAR(50) DEFAULT 'discussion'"))
                conn.commit()
                print("Column 'nature_of_point' added successfully.")
        except Exception as e:
            print(f"Error adding column: {e}")

if __name__ == "__main__":
    add_column()
