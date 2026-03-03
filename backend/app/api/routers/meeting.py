from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone
from typing import List

from app.core.database import get_db
from app.models.meeting import Meeting
from app.models.project import Project

router = APIRouter(
    prefix="/meetings",
    tags=["Meetings"]
)

def parse_iso_datetime(dt_str):
    if not dt_str:
        return datetime.now(timezone.utc)
    try:
        # Handle 'Z' suffix for UTC
        if isinstance(dt_str, str) and dt_str.endswith('Z'):
            dt_str = dt_str.replace('Z', '+00:00')
        return datetime.fromisoformat(dt_str)
    except Exception as e:
        print(f"Error parsing date {dt_str}: {e}")
        return datetime.now(timezone.utc)

# -------------------------
# CREATE MEETING
# -------------------------
@router.post("/", response_model=dict)
def create_meeting(payload: dict, db: Session = Depends(get_db)):
    try:
        print(f"Creating meeting with payload: {payload}")
        project_id = payload.get("project_id")
        project_name = payload.get("project_name")

        if project_id is not None:
            # Ensure it is an integer
            try:
                project_id = int(project_id)
            except (ValueError, TypeError):
                project_id = None

        # If project_id is still None but project_name is provided, try to find the project by name
        if project_id is None and project_name:
            project = db.query(Project).filter(Project.name == project_name).first()
            if project:
                project_id = project.id
        
        # FINAL FALLBACK: If project_id is still None, we might be creating a meeting
        # from a context where we only have project_name but it's not in the DB yet,
        # or we are in a project view but project_id wasn't passed.
        # However, for now, let's just log it.
        if project_id is None:
            print(f"Warning: Creating meeting without project_id. Project name was: {project_name}")

        meeting_date_str = payload.get("meeting_date")
        meeting_date = parse_iso_datetime(meeting_date_str)

        meeting = Meeting(
            title=payload.get("title", "Untitled Meeting"),
            project_id=project_id,
            meeting_type=payload.get("meeting_type", "General"),
            meeting_date=meeting_date,
            transcript=payload.get("transcript"),
            created_at=datetime.now(timezone.utc)
        )
        db.add(meeting)
        db.commit()
        db.refresh(meeting)

        print(f"Meeting created successfully: {meeting.id} for project_id: {project_id}")
        return {
            "message": "Meeting created successfully",
            "data": {
                "id": meeting.id,
                "project_id": meeting.project_id,
                "title": meeting.title,
                "meeting_type": meeting.meeting_type,
                "meeting_date": meeting.meeting_date,
                "transcript": meeting.transcript
            }
        }
    except Exception as e:
        print(f"Error creating meeting: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------
# GET MEETINGS BY PROJECT
# -------------------------
@router.get("/project/{project_id}", response_model=List[dict])
def get_project_meetings(project_id: str, db: Session = Depends(get_db)):
    # Try to treat project_id as an integer first
    try:
        pid = int(project_id)
        meetings = (
            db.query(Meeting)
            .options(joinedload(Meeting.moms))
            .filter(Meeting.project_id == pid)
            .order_by(Meeting.meeting_date.desc())
            .all()
        )
    except ValueError:
        # If not an integer, treat it as a project name
        print(f"Searching for meetings by project name: {project_id}")
        # 1. Search for meetings linked to a project with this name
        meetings_by_project = (
            db.query(Meeting)
            .join(Project)
            .options(joinedload(Meeting.moms))
            .filter(Project.name == project_id)
            .all()
        )
        print(f"Found {len(meetings_by_project)} meetings by project name join")
        
        # 2. Search for meetings that might have the project name in their title (fallback)
        meetings_by_title = (
            db.query(Meeting)
            .options(joinedload(Meeting.moms))
            .filter(Meeting.title.ilike(f"%{project_id}%"))
            .all()
        )
        print(f"Found {len(meetings_by_title)} meetings by title match")
        
        # Combine results and remove duplicates
        seen_ids = set()
        meetings = []
        
        for m in meetings_by_project + meetings_by_title:
            if m.id not in seen_ids:
                meetings.append(m)
                seen_ids.add(m.id)
        
        # Sort by date descending
        meetings.sort(key=lambda x: x.meeting_date, reverse=True)

    return [
        {
            "id": m.id,
            "project_id": m.project_id,
            "project_name": m.project.name if m.project else None,
            "title": m.title,
            "meeting_type": m.meeting_type,
            "meeting_date": m.meeting_date,
            "transcript": m.transcript,
            "created_at": m.created_at,
            "moms": [
                {
                    "id": mom.id,
                    "action_item": mom.action_item,
                    "owner": mom.owner,
                    "criticality": mom.criticality,
                    "status": mom.status,
                    "target_date": mom.target_date,
                    "function_dept": mom.function_dept,
                    "remainder": mom.remainder,
                    "approval_status": mom.approval_status,
                    "attendees": mom.attendees,
                    "nature_of_point": mom.nature_of_point
                }
                for mom in m.moms
            ]
        }
        for m in meetings
    ]


# -------------------------
# LIST ALL MEETINGS
# -------------------------
@router.get("/", response_model=List[dict])
def list_meetings(db: Session = Depends(get_db)):
    meetings = db.query(Meeting).order_by(Meeting.meeting_date.desc()).all()

    return [
        {
            "id": m.id,
            "project_id": m.project_id,
            "title": m.title,
            "meeting_type": m.meeting_type,
            "meeting_date": m.meeting_date,
            "transcript": m.transcript,
            "created_at": m.created_at
        }
        for m in meetings
    ]


# -------------------------
# GET SINGLE MEETING
# -------------------------
@router.get("/{meeting_id}", response_model=dict)
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    return {
        "id": meeting.id,
        "title": meeting.title,
        "meeting_type": meeting.meeting_type,
        "meeting_date": meeting.meeting_date,
        "transcript": meeting.transcript,
        "created_at": meeting.created_at
    }


# -------------------------
# UPDATE MEETING
# -------------------------
@router.put("/{meeting_id}", response_model=dict)
def update_meeting(meeting_id: int, payload: dict, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    meeting.title = payload.get("title", meeting.title)
    meeting.meeting_type = payload.get("meeting_type", meeting.meeting_type)
    meeting.meeting_date = datetime.fromisoformat(
        payload.get("meeting_date", meeting.meeting_date.isoformat())
    )
    meeting.transcript = payload.get("transcript", meeting.transcript)

    db.commit()
    db.refresh(meeting)

    return {
        "message": "Meeting updated successfully",
        "data": {
            "id": meeting.id,
            "title": meeting.title,
            "meeting_type": meeting.meeting_type,
            "meeting_date": meeting.meeting_date,
            "transcript": meeting.transcript
        }
    }


# -------------------------
# DELETE MEETING
# -------------------------
@router.delete("/{meeting_id}", response_model=dict)
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    db.delete(meeting)
    db.commit()

    return {"message": "Meeting deleted successfully"}
