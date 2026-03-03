from fastapi.testclient import TestClient
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.main import app

client = TestClient(app)

def test_mom_flow():
    print("Testing MOM Flow...")

    # 1. Create a meeting
    meeting_payload = {
        "title": "Test Meeting for MOM Linkage",
        "meeting_type": "test",
        "meeting_date": "2023-10-27T10:00:00"
    }
    response = client.post("/api/meetings/", json=meeting_payload)
    if response.status_code != 200:
        print(f"Failed to create meeting: {response.text}")
        return

    meeting_data = response.json()["data"]
    meeting_id = meeting_data["id"]
    print(f"Created meeting with ID: {meeting_id}")

    # 2. Create a MOM point linked to this meeting
    mom_payload = {
        "meeting_id": meeting_id,
        "meeting_title": "Test Meeting for MOM Linkage",
        "action_item": "This is a test action item linked to meeting",
        "owner": "Tester",
        "criticality": "medium",
        "target_date": "2023-11-01T10:00:00",
        "function_dept": "IT",
        "remainder": "none",
        "approval_status": "pending",
        "attendees": "Tester, Developer",
        "status": "pending",
        "nature_of_point": "discussion"
    }
    
    response = client.post("/api/mom/create", json=mom_payload)
    if response.status_code != 200:
        print(f"Failed to create MOM point: {response.text}")
        return
    
    mom_data = response.json()
    print(f"Created MOM point with ID: {mom_data['id']} and meeting_id: {mom_data.get('meeting_id')}")

    # 3. List MOM points for this meeting
    response = client.get(f"/api/mom/list?meeting_id={meeting_id}")
    if response.status_code != 200:
        print(f"Failed to list MOM points: {response.text}")
        return
    
    points = response.json()
    print(f"Fetched {len(points)} points for meeting_id {meeting_id}")
    
    found = any(p['id'] == mom_data['id'] for p in points)
    if found:
        print("SUCCESS: Created MOM point found in filtered list.")
    else:
        print("FAILURE: Created MOM point NOT found in filtered list.")

    # 4. List MOM points for a non-existent meeting
    fake_id = 999999
    response = client.get(f"/api/mom/list?meeting_id={fake_id}")
    points_fake = response.json()
    print(f"Fetched {len(points_fake)} points for meeting_id {fake_id}")
    
    if len(points_fake) == 0:
        print("SUCCESS: No points found for non-existent meeting.")
    else:
        print("FAILURE: Points found for non-existent meeting (should be empty).")

def test_multiple_meetings_per_project():
    project_payload = {
        "name": "Test Multi Meeting Project",
        "manager": "Tester",
        "status": "Active"
    }
    project_response = client.post("/api/projects/", json=project_payload)
    assert project_response.status_code == 200
    project_id = project_response.json()["id"]

    meeting_payload_1 = {
        "title": "Project Kickoff",
        "project_id": project_id,
        "meeting_type": "test",
        "meeting_date": "2023-10-27T10:00:00"
    }
    meeting_response_1 = client.post("/api/meetings/", json=meeting_payload_1)
    assert meeting_response_1.status_code == 200

    meeting_payload_2 = {
        "title": "Follow Up Meeting",
        "project_id": project_id,
        "meeting_type": "test",
        "meeting_date": "2023-10-28T10:00:00"
    }
    meeting_response_2 = client.post("/api/meetings/", json=meeting_payload_2)
    assert meeting_response_2.status_code == 200

    list_response = client.get(f"/api/meetings/project/{project_id}")
    assert list_response.status_code == 200
    meetings = list_response.json()
    assert len(meetings) >= 2

if __name__ == "__main__":
    test_mom_flow()
    test_multiple_meetings_per_project()
