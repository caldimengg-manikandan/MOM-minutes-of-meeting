import sys
import os
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine

def check_columns():
    print("Checking columns in 'mom_points' table...")
    with engine.connect() as conn:
        try:
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='mom_points'"))
            columns = [row[0] for row in result.fetchall()]
            print(f"Columns found: {columns}")
            if 'nature_of_point' in columns:
                print("✅ 'nature_of_point' column exists.")
            else:
                print("❌ 'nature_of_point' column is MISSING.")
        except Exception as e:
            print(f"Error checking columns: {e}")

if __name__ == "__main__":
    check_columns()
