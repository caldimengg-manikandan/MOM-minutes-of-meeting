import uvicorn
import os
import sys

if __name__ == "__main__":
    # Add the current directory to sys.path to ensure 'app' can be imported
    # This fixes ModuleNotFoundError in the reloader subprocess
    current_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, current_dir)
    
    print(f"Starting server from: {current_dir}")
    print("Access the API at: http://127.0.0.1:8000")
    
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
