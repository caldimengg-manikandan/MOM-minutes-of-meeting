# Test script to verify API endpoints
import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_endpoints():
    print("Testing Employee Master API Endpoints\n")
    print("=" * 50)
    
    # Test 1: Get all employees
    print("\n1. GET /api/employees")
    try:
        response = requests.get(f"{BASE_URL}/employees")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print(f"   ✓ Success - Found {len(response.json())} employees")
        else:
            print(f"   ✗ Error: {response.text}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # Test 2: Get all columns
    print("\n2. GET /api/employees/columns/all")
    try:
        response = requests.get(f"{BASE_URL}/employees/columns/all")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print(f"   ✓ Success - Found {len(response.json())} custom columns")
        else:
            print(f"   ✗ Error: {response.text}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # Test 3: Create a test column
    print("\n3. POST /api/employees/columns/create")
    try:
        test_column = {
            "column_name": "test_phone",
            "column_label": "Phone Number",
            "data_type": "text",
            "is_required": False
        }
        response = requests.post(
            f"{BASE_URL}/employees/columns/create",
            json=test_column
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 201:
            print(f"   ✓ Success - Created column: {response.json()}")
        elif response.status_code == 400:
            print(f"   ⚠ Column might already exist: {response.json()}")
        else:
            print(f"   ✗ Error: {response.text}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # Test 4: Create a test employee
    print("\n4. POST /api/employees")
    try:
        test_employee = {
            "name": "Test User",
            "email": f"test{hash('test')}@example.com",
            "department": "Engineering",
            "role": "Developer",
            "status": "Active",
            "custom_fields": {
                "test_phone": "123-456-7890"
            }
        }
        response = requests.post(
            f"{BASE_URL}/employees",
            json=test_employee
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 201:
            print(f"   ✓ Success - Created employee: {response.json()['name']}")
        elif response.status_code == 400:
            print(f"   ⚠ Employee might already exist: {response.json()}")
        else:
            print(f"   ✗ Error: {response.text}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    print("\n" + "=" * 50)
    print("\n✅ API endpoint testing complete!")
    print("\nIf you see errors, make sure:")
    print("1. Backend server is running on port 8000")
    print("2. Database migrations have been run")
    print("3. CORS is configured correctly")

if __name__ == "__main__":
    test_endpoints()