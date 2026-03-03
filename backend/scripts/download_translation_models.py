import sys
import os

# Add parent directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.utils.translator import install_offline_languages

if __name__ == "__main__":
    print("Starting download of offline translation models...")
    install_offline_languages()
    print("Download process completed.")
