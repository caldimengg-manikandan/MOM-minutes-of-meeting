import requests
import sys

# Use localhost since we are running on the machine
API_URL = "http://localhost:8000/api"

def test_project_meeting_flow():
    # 1. Create a Project
    print("Creating a test project...")
    project_data = {
        "name": "Test Dashboard Project",
        "manager": "John Doe",
        "status": "Active"
    }
    # Assuming the projects endpoint exists and works
    try:
        resp = requests.post(f"{API_URL}/projects/", json=project_data)
        if resp.status_code == 200:
            project = resp.json()
            project_id = project['id']
            print(f"Project created: {project_id} - {project['name']}")
        else:
            print(f"Failed to create project: {resp.status_code} {resp.text}")
            return
    except Exception as e:
        print(f"Error creating project: {e}")
        return

    # 2. Create a Meeting linked to the Project
    print("Creating a meeting linked to the project...")
    meeting_data = {
        "title": "Weekly Sync",
        "project_id": project_id,
        "meeting_type": "discussion",
        "meeting_date": "2023-10-27T10:00:00"
    }
    try:
        resp = requests.post(f"{API_URL}/meetings/", json=meeting_data)
        if resp.status_code == 200:
            meeting = resp.json()['data']
            meeting_id = meeting['id']
            print(f"Meeting created: {meeting_id} linked to Project {meeting.get('project_id')}")
        else:
            print(f"Failed to create meeting: {resp.status_code} {resp.text}")
            return
    except Exception as e:
        print(f"Error creating meeting: {e}")
        return

    # 3. Create a MOM for the meeting
    print("Creating MOM points for the meeting...")
    mom_data = {
        "meeting_id": meeting_id,
        "meeting_title": "Weekly Sync",
        "action_item": "Fix the dashboard bug",
        "owner": "Alice",
        "criticality": "high",
        "target_date": "2023-10-30T10:00:00",
        "function_dept": "engineering"
    }
    try:
        resp = requests.post(f"{API_URL}/mom/create", json=mom_data)
        if resp.status_code == 200:
            print("MOM created successfully.")
        else:
            print(f"Failed to create MOM: {resp.status_code} {resp.text}")
            return
    except Exception as e:
        print(f"Error creating MOM: {e}")
        return

    # 4. Fetch Meetings by Project ID
    print(f"Fetching meetings for Project {project_id}...")
    try:
        resp = requests.get(f"{API_URL}/meetings/project/{project_id}")
        if resp.status_code == 200:
            meetings = resp.json()
            print(f"Found {len(meetings)} meetings for project.")
            for m in meetings:
                print(f"Meeting: {m['title']} (ID: {m['id']})")
                print(f"  MOMs count: {len(m.get('moms', []))}")
                for mom in m.get('moms', []):
                    print(f"    - {mom['action_item']} ({mom['owner']})")
            
            if len(meetings) > 0 and len(meetings[0].get('moms', [])) > 0:
                print("SUCCESS: Project -> Meeting -> MOM retrieval working.")
            else:
                print("FAILURE: Could not retrieve nested MOMs.")
        else:
            print(f"Failed to fetch project meetings: {resp.status_code} {resp.text}")
    except Exception as e:
        print(f"Error fetching project meetings: {e}")

if __name__ == "__main__":
    test_project_meeting_flow()
