from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.mom import MOM, Criticality
from app.schemas.mom import MOMCreate, MOMResponse, MOMUpdate
from app.utils.text_cleaner import clean_transcript_text

from typing import Optional
import re

router = APIRouter(prefix="/mom", tags=["MOM"])


def _split_action_item(text: str) -> list[str]:
    cleaned = (text or "").strip()
    if not cleaned:
        return []

    raw_segments = [
        segment.strip()
        for segment in re.split(r"[.!?\n]+", cleaned)
        if segment.strip()
    ]

    segments = []
    for segment in raw_segments:
        words = [w for w in segment.split() if w]
        # Allow shorter segments (e.g. "Task done") - changed from 4 to 2
        if len(words) >= 2:
            segments.append(segment)

    return segments


@router.post("/create", response_model=MOMResponse)
def create_mom(mom: MOMCreate, db: Session = Depends(get_db)):
    print(f"Received MOM create request: {mom}")
    try:
        crit = Criticality(mom.criticality)
    except ValueError:
        crit = Criticality.MEDIUM

    cleaned_action_item = clean_transcript_text(mom.action_item)
    segments = _split_action_item(cleaned_action_item)

    if not segments:
        raise HTTPException(status_code=400, detail="No valid discussion points found")

    created_moms = []

    try:
        for segment in segments:
            mom_obj = MOM(
                meeting_id=mom.meeting_id,
                meeting_title=mom.meeting_title,
                action_item=segment,
                owner=mom.owner,
                criticality=crit,
                target_date=mom.target_date,
                function_dept=mom.function_dept,
                remainder=mom.remainder,
                approval_status=mom.approval_status,
                attendees=mom.attendees,
                status=mom.status,
                nature_of_point=mom.nature_of_point,
            )
            db.add(mom_obj)
            created_moms.append(mom_obj)

        db.commit()

        for mom_obj in created_moms:
            db.refresh(mom_obj)

        first_mom = created_moms[0]
        print(f"Successfully created {len(created_moms)} MOM points, first id: {first_mom.id}")
        return first_mom
    except Exception as e:
        print(f"Error creating MOM in DB: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


from app.models.meeting import Meeting
from app.models.project import Project

# ✅ LIST MOM
@router.get("/list")
def list_mom(meeting_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(MOM)
    if meeting_id:
        query = query.filter(MOM.meeting_id == meeting_id)
    
    results = query.order_by(MOM.created_at.desc()).all()
    
    # Enrich with project name
    enriched_results = []
    for mom in results:
        project_name = "Unknown"
        if mom.meeting and mom.meeting.project:
            project_name = mom.meeting.project.name
        
        # Convert to dict and add project_name
        mom_dict = {
            "id": mom.id,
            "meeting_id": mom.meeting_id,
            "meeting_title": mom.meeting_title,
            "project_name": project_name,
            "action_item": mom.action_item,
            "owner": mom.owner,
            "criticality": mom.criticality.value if hasattr(mom.criticality, 'value') else mom.criticality,
            "status": mom.status,
            "target_date": mom.target_date,
            "created_at": mom.created_at,
            "function_dept": mom.function_dept,
            "remainder": mom.remainder,
            "approval_status": mom.approval_status,
            "attendees": mom.attendees,
            "nature_of_point": mom.nature_of_point
        }
        enriched_results.append(mom_dict)
        
    return enriched_results


# ✅ UPDATE MOM
@router.put("/update/{mom_id}", response_model=MOMResponse)
def update_mom(mom_id: int, mom: MOMUpdate, db: Session = Depends(get_db)):
    mom_obj = db.query(MOM).filter(MOM.id == mom_id).first()

    if not mom_obj:
        raise HTTPException(status_code=404, detail="MOM not found")

    update_data = mom.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key == "criticality" and value:
            try:
                setattr(mom_obj, key, Criticality(value))
            except ValueError:
                pass # Ignore invalid enum values
        elif key == "action_item" and value:
             setattr(mom_obj, key, clean_transcript_text(value))
        else:
            setattr(mom_obj, key, value)

    db.commit()
    db.refresh(mom_obj)

    return mom_obj


# ✅ DELETE MOM
@router.delete("/delete/{mom_id}")
def delete_mom(mom_id: int, db: Session = Depends(get_db)):
    mom_obj = db.query(MOM).filter(MOM.id == mom_id).first()

    if not mom_obj:
        raise HTTPException(status_code=404, detail="MOM not found")

    db.delete(mom_obj)
    db.commit()

    return {"message": "MOM deleted successfully"}
