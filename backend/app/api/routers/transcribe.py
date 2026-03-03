from fastapi import APIRouter, UploadFile, File, HTTPException, Body, Form
from app.utils.mom_extractor import extract_mom
from app.utils.translator import translate_text
from app.utils.text_cleaner import clean_transcript_text
from pydantic import BaseModel
import json

router = APIRouter()

class TextRequest(BaseModel):
    text: str

class TranslationRequest(BaseModel):
    text: str
    source_lang: str
    target_lang: str = "en"
    use_online: bool = False

@router.post("/translate/")
async def translate_endpoint(request: TranslationRequest):
    """
    Translate text from source_lang to target_lang.
    """
    result = translate_text(request.text, request.source_lang, request.target_lang, request.use_online)
    result = clean_transcript_text(result)
    return {"translation": result}

@router.post("/transcribe/")
async def transcribe_audio(
    media: UploadFile = File(...), 
    language: str = Form("en"),
    use_online: bool = Form(False)
):
    """
    Backend transcription is deprecated in favor of Browser Speech Recognition.
    This endpoint now returns a 404/422 to trigger the frontend fallback.
    """
    raise HTTPException(
        status_code=422, 
        detail="Backend transcription (Vosk) has been removed. Please use Browser Speech Recognition for Tamil and English."
    )

@router.post("/generate-mom/")
async def generate_mom(request: TextRequest):
    """
    Generate MOM from provided text (e.g. from Live Speech)
    """
    mom = extract_mom(request.text)
    return {
        "success": True,
        "mom": mom
    }
