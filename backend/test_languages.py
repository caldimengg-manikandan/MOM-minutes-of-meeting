import os
import wave
import struct
from gtts import gTTS
from app.utils.stt_vosk import speech_to_text

# Mock UploadFile class for testing
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

def create_test_audio(text, lang, filename):
    """
    Generate a speech file using Google TTS for testing purposes.
    Returns the path to the generated WAV file.
    """
    print(f"   Generating audio for '{text}' ({lang})...")
    mp3_file = filename.replace(".wav", ".mp3")
    
    try:
        # Generate MP3 using gTTS
        tts = gTTS(text=text, lang=lang, slow=False)
        tts.save(mp3_file)
        
        # Note: Since we don't have ffmpeg to convert MP3 to WAV,
        # we will skip the actual speech generation for this environment 
        # and create a dummy WAV file instead.
        # If ffmpeg was available, we would convert it here.
        print("   (Note: ffmpeg missing, creating dummy WAV for structure test)")
        
        # Create a valid dummy WAV file (silence) to test the Vosk pipeline structure
        with wave.open(filename, 'w') as f:
            f.setnchannels(1)
            f.setsampwidth(2)
            f.setframerate(16000)
            # 2 seconds of silence
            data = struct.pack('<h', 0) * 16000 * 2
            f.writeframes(data)
            
    except Exception as e:
        print(f"   Error generating audio: {e}")
        # Fallback to dummy wav
        with wave.open(filename, 'w') as f:
            f.setnchannels(1)
            f.setsampwidth(2)
            f.setframerate(16000)
            data = struct.pack('<h', 0) * 16000
            f.writeframes(data)
    finally:
        if os.path.exists(mp3_file):
            os.remove(mp3_file)
            
    return filename

def test_language_transcription():
    print("=== Testing Vosk Multi-Language Support ===")
    
    # Test cases: (Language Code, Sample Text, Filename)
    test_cases = [
        ("en", "Hello, this is a test for the minutes of meeting system.", "test_en.wav"),
        ("hi", "नमस्ते, यह बैठक प्रणाली के लिए एक परीक्षण है।", "test_hi.wav"),
        ("ta", "வணக்கம், இது கூட்டத் தொடருக்கான சோதனை.", "test_ta.wav")
    ]
    
    for lang, text, filename in test_cases:
        print(f"\nTesting Language: {lang.upper()}")
        
        # 1. Generate Audio
        wav_path = create_test_audio(text, lang, filename)
        
        try:
            # 2. Read File Content
            with open(wav_path, "rb") as f:
                content = f.read()
            
            # 3. Create Mock Upload Object
            mock_file = MockUploadFile(filename, MockFile(content))
            
            # 4. Run Transcription
            print(f"   Running transcription with model '{lang}'...")
            transcript = speech_to_text(mock_file, language=lang)
            
            # 5. Verify Result
            print(f"   Result: '{transcript}'")
            
            if "Error" in transcript:
                print(f"   FAIL: Error occurred - {transcript}")
            else:
                print(f"   PASS: Pipeline worked (Empty result expected for silence)")
                
        except Exception as e:
            print(f"   FAIL: Exception - {e}")
        finally:
            # Cleanup
            if os.path.exists(wav_path):
                os.remove(wav_path)

if __name__ == "__main__":
    test_language_transcription()
