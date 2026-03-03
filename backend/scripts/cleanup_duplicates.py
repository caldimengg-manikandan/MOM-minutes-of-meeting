import sys
import os
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine

def cleanup_duplicates():
    print("Cleaning up duplicate records in 'mom_points'...")
    with engine.connect() as conn:
        try:
            # Find duplicates based on meeting_title and action_item
            # We want to keep the one with the MINIMUM id (oldest)
            
            # This query deletes records that are NOT the minimum ID for their group
            delete_query = text("""
                DELETE FROM mom_points a
                USING mom_points b
                WHERE a.id > b.id
                AND a.meeting_title = b.meeting_title
                AND a.action_item = b.action_item
            """)
            
            result = conn.execute(delete_query)
            conn.commit()
            
            print(f"Deleted {result.rowcount} duplicate rows.")
            
        except Exception as e:
            print(f"Error cleaning up duplicates: {e}")

if __name__ == "__main__":
    cleanup_duplicates()
