import sys
import os

# Add the parent directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import engine, Base
# Import all models to ensure they are registered with Base.metadata
from app.models.user import User
from app.models.employee import Employee
from app.models.employee_access import EmployeeAccess
from app.models.department import Department
from app.models.project import Project
from app.models.part import Part
from app.models.mom import MOM
from app.models.meeting import Meeting
# from app.models.action_item import ActionItem
# from app.models.upload_tracker import UploadTracker
# Add other models if needed

def init_db():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

if __name__ == "__main__":
    init_db()
