import os
import argostranslate.package
import argostranslate.translate
from deep_translator import GoogleTranslator

# Offline Translation Setup
def install_offline_languages():
    """
    Installs required Argos Translate packages for Offline Mode.
    We need: Hindi -> English, Tamil -> English.
    """
    try:
        print("Updating Argos Translate package index...")
        argostranslate.package.update_package_index()
        available_packages = argostranslate.package.get_available_packages()
        
        # Define required language pairs (from_code, to_code)
        required_pairs = [
            ("hi", "en"),
            ("ta", "en") # Note: Tamil might not be in standard Argos repository, we will check.
        ]

        installed_packages = argostranslate.package.get_installed_packages()
        
        for from_code, to_code in required_pairs:
            # Check if already installed
            is_installed = any(
                pkg.from_code == from_code and pkg.to_code == to_code 
                for pkg in installed_packages
            )
            
            if not is_installed:
                print(f"Installing offline translation model: {from_code} -> {to_code}...")
                # Find package
                package_to_install = next(
                    (pkg for pkg in available_packages 
                     if pkg.from_code == from_code and pkg.to_code == to_code),
                    None
                )
                
                if package_to_install:
                    argostranslate.package.install_from_path(package_to_install.download())
                    print(f"Installed {from_code}->{to_code}")
                else:
                    print(f"Warning: Offline model for {from_code}->{to_code} not found in Argos repository.")
            else:
                print(f"Offline model {from_code}->{to_code} is already installed.")
                
    except Exception as e:
        print(f"Error setting up offline translation: {e}")

# Initialize offline models on import (or call this explicitly on startup)
# We won't auto-call it on import to avoid blocking, but it's good to have.

def translate_text(text: str, source_lang: str, target_lang: str = "en", use_online: bool = False) -> str:
    """
    Translates text from source_lang to target_lang.
    
    Args:
        text (str): Text to translate.
        source_lang (str): Source language code (e.g., 'hi', 'ta', 'en').
        target_lang (str): Target language code (default 'en').
        use_online (bool): If True, use Google Translate API. If False, use Argos Translate.
        
    Returns:
        str: Translated text.
    """
    if not text or not text.strip():
        return ""
        
    # English to English - no translation needed
    if source_lang.lower().startswith("en") and target_lang.lower().startswith("en"):
        return text

    # Normalization
    source_lang_lower = source_lang.lower()
    if source_lang_lower in ["hi-in", "hindi", "hi"]: 
        source_lang = "hi"
    elif source_lang_lower in ["ta-in", "tamil", "ta"]: 
        source_lang = "ta"
    elif source_lang_lower in ["en-us", "english", "en"]: 
        source_lang = "en"
    else:
        source_lang = "auto" # Fallback to auto-detection
    
    if source_lang == target_lang and source_lang != "auto":
        return text

    try:
        if use_online:
            # Online Mode - Use 'auto' for mixed language detection if needed
            # If source is Tamil but might contain English, 'auto' is often better
            # But if we know it's Tamil script, 'ta' is safer.
            # Let's use 'auto' if the text looks like Latin script but source is 'ta'
            effective_source = source_lang
            if source_lang == "ta" and text.isascii():
                # If it's all ASCII but marked as Tamil, it's likely Tanglish (Latin script)
                # Google Translate handles Tanglish better with 'auto' or 'ta'
                effective_source = "auto"

            translator = GoogleTranslator(source=effective_source, target=target_lang)
            return translator.translate(text)
        else:
            # Offline Mode
            try:
                translatedText = argostranslate.translate.translate(text, source_lang, target_lang)
                return translatedText
            except Exception as e:
                # Fallback if model not found or other error
                if source_lang == 'ta' and target_lang == 'en':
                    return f"[Tamil Offline Translation Not Supported - Please Enable Online Mode] {text}"
                print(f"Offline translation error ({source_lang}->{target_lang}): {e}")
                return f"[Offline Translation Unavailable] {text}"
                
    except Exception as e:
        return f"[Translation Error] {text}"
