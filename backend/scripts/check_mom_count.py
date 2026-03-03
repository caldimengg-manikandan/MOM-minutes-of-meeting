import sys
import os
from sqlalchemy import text, func
from sqlalchemy.orm import sessionmaker

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine
from app.models.mom import MOM

def check_db_count():
    print("Checking 'mom_points' table...")
    with engine.connect() as conn:
        try:
            # Count total rows
            result = conn.execute(text("SELECT COUNT(*) FROM mom_points"))
            count = result.scalar()
            print(f"Total rows in mom_points: {count}")
            
            # Check for potential duplicates (by meeting_title and action_item)
            print("Checking for duplicate content...")
            result = conn.execute(text("""
                SELECT meeting_title, action_item, COUNT(*)
                FROM mom_points
                GROUP BY meeting_title, action_item
                HAVING COUNT(*) > 1
            """))
            duplicates = result.fetchall()
            if duplicates:
                print(f"Found {len(duplicates)} sets of duplicates based on title/action.")
                for d in duplicates[:5]:
                    print(f" - {d[0]} | {d[1]} : {d[2]} copies")
            else:
                print("No content duplicates found.")
                
            # Check max ID
            result = conn.execute(text("SELECT MAX(id) FROM mom_points"))
            max_id = result.scalar()
            print(f"Max ID: {max_id}")

        except Exception as e:
            print(f"Error checking DB: {e}")

if __name__ == "__main__":
    check_db_count()
