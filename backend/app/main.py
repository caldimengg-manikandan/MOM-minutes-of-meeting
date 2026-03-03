from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, employees, department, project, part, employee_access, upload_tracker
from app.api.routers import meeting, transcribe
from app.api.mom import mom_points

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(employees.router, prefix="/api")
app.include_router(department.router, prefix="/api")
app.include_router(project.router, prefix="/api")
app.include_router(part.router, prefix="/api")
app.include_router(employee_access.router, prefix="/api")
app.include_router(upload_tracker.router, prefix="/api")
app.include_router(meeting.router, prefix="/api")
app.include_router(transcribe.router, prefix="/api")
app.include_router(mom_points.router, prefix="/api")

# root check
@app.get("/")
def root():
    return {"message": "Backend running"}

# ✅ MOM API (Dummy endpoint, keeping it for now but the real one is at /api/meetings)
@app.get("/moms")
def get_moms():
    return [
        {
            "id": 1,
            "meeting": "Project Kickoff",
            "action": "Prepare MOM module",
            "owner": "Preethi",
            "status": "In Progress"
        }
    ]
