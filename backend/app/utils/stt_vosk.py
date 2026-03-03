import os
import json
import speech_recognition as sr
from vosk import Model, KaldiRecognizer
from fastapi import HTTPException

# Path setup
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.path.join(BASE_DIR, "models")

MODEL_PATHS = {
    "en": os.path.join(MODELS_DIR, "model-en"),
    "hi": os.path.join(MODELS_DIR, "model-hi"),
    "ta": os.path.join(MODELS_DIR, "model-ta"),
    # Mappings for frontend codes
    "en-us": os.path.join(MODELS_DIR, "model-en"),
    "hi-in": os.path.join(MODELS_DIR, "model-hi"),
    "ta-in": os.path.join(MODELS_DIR, "model-ta"),
}

# Global cache for loaded models to avoid reloading (Singleton pattern)
LOADED_MODELS = {}

def get_model(lang_code):
    """
    Load Vosk model for the given language code.
    """
    lang = lang_code.lower()
    
    # Simple mapping for frontend codes like 'en-US' -> 'en-us'
    if lang not in MODEL_PATHS:
        # Try splitting by hyphen
        prefix = lang.split('-')[0]
        if prefix in MODEL_PATHS:
            lang = prefix
        else:
            # Default to English if unknown
            lang = "en"
            
    if lang in LOADED_MODELS:
        return LOADED_MODELS[lang]

    model_path = MODEL_PATHS.get(lang)
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Vosk model for language '{lang}' not found at {model_path}. "
            "Please run 'python backend/download_models.py' to install models."
        )

    print(f"Loading Vosk model for {lang} from {model_path}...")
    model = Model(model_path)
    LOADED_MODELS[lang] = model
    return model

def speech_to_text(upload_file, language="en"):
    """
    Convert speech in the uploaded file to text using Vosk (Offline).
    """
    try:
        # Load Model
        model = get_model(language)
    except Exception as e:
        return f"Error: {str(e)}"

    # Create a temporary file to read audio using SpeechRecognition
    import tempfile
    suffix = os.path.splitext(upload_file.filename)[1].lower()
    if not suffix:
        suffix = ".wav"
        
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(upload_file.file.read())
        tmp_path = tmp.name

    try:
        # Use SpeechRecognition to normalize audio format (read WAV, etc.)
        # Note: Non-WAV formats (MP3, etc.) require ffmpeg to be installed.
        recognizer = sr.Recognizer()
        
        with sr.AudioFile(tmp_path) as source:
            # Read the entire audio file
            # convert_rate=16000 and convert_width=2 ensure 16kHz 16-bit Mono for Vosk
            audio_data = recognizer.record(source)
            raw_data = audio_data.get_raw_data(convert_rate=16000, convert_width=2)
            
            # Initialize Vosk Recognizer
            rec = KaldiRecognizer(model, 16000)
            rec.SetWords(True)
            
            # Process audio
            if rec.AcceptWaveform(raw_data):
                res = json.loads(rec.Result())
                text = res.get("text", "")
            else:
                res = json.loads(rec.FinalResult())
                text = res.get("text", "")
                
            return text

    except sr.UnknownValueError:
        return "" # Could not understand audio
    except ValueError as e:
        # Often happens if format is not supported (e.g. missing ffmpeg for mp3)
        if "Audio file could not be read" in str(e):
             return "Error: Audio format not supported or ffmpeg missing. Please upload a WAV file."
        return f"Error processing audio: {str(e)}"
    except Exception as e:
        return f"Error processing audio file: {str(e)}"
    finally:
        # Clean up
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
