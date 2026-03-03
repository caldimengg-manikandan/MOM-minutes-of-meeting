import os
import wave
import struct
from app.utils.stt_vosk import speech_to_text

# Mock UploadFile class
class MockUploadFile:
    def __init__(self, filename, content):
        self.filename = filename
        self.file = content
        self.content_type = "audio/wav"

class MockFile:
    def __init__(self, content):
        self.content = content
        self.pos = 0
    
    def read(self, size=-1):
        if size == -1:
            return self.content
        data = self.content[self.pos:self.pos+size]
        self.pos += size
        return data

def create_dummy_wav(filename):
    # Create 1 second of silence
    with wave.open(filename, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(16000)
        data = struct.pack('<h', 0) * 16000
        f.writeframes(data)
    return filename

def test_vosk_integration():
    print("1. Checking Models...")
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    if not os.path.exists(models_dir):
        print("FAIL: Models directory missing")
        return

    en_model = os.path.join(models_dir, "model-en")
    if os.path.exists(en_model):
        print(f"PASS: English model found at {en_model}")
    else:
        print("FAIL: English model missing")
        
    print("\n2. Testing Speech-to-Text with Silence (WAV)...")
    wav_path = "dummy_test.wav"
    create_dummy_wav(wav_path)
    
    try:
        with open(wav_path, "rb") as f:
            content = f.read()
            
        mock_file = MockUploadFile("dummy_test.wav", MockFile(content))
        
        # Test English
        print("   Running transcription (en)...")
        result = speech_to_text(mock_file, language="en")
        print(f"   Result: '{result}'")
        
        if "Error" in result:
             print("FAIL: Transcription returned error")
        else:
             print("PASS: Transcription ran successfully (empty result expected for silence)")

        # Test Hindi loading
        print("   Running transcription (hi)...")
        # Reset file pos
        mock_file.file.pos = 0
        result_hi = speech_to_text(mock_file, language="hi")
        print(f"   Result (hi): '{result_hi}'")

    except Exception as e:
        print(f"FAIL: Exception during test: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if os.path.exists(wav_path):
            os.remove(wav_path)

if __name__ == "__main__":
    test_vosk_integration()
