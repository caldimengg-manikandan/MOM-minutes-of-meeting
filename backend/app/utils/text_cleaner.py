import re

def clean_transcript_text(text: str) -> str:
    """
    Cleans and normalizes transcript text by removing translation artifacts,
    non-English scripts (Hindi/Tamil), and extra whitespace.
    """
    if not text:
        return ""

    # 1. Remove [Translated: ...] or (Translated: ...) pattern (Case insensitive)
    # We want to remove the whole block including the wrapper if it marks the translation,
    # OR just the tag if the text inside is what we want?
    # User said: 'Remove ... "[Translated: ...]"'
    # In the previous turn, the format was `original [Translated: translated]`.
    # And I fixed it to be just `translated`.
    # But if old clients send data, or if the "Translated:" tag leaks in.
    # If the text is ONLY `[Translated: hello world]`, we probably want `hello world`.
    # But if it is `namaste [Translated: hello]`, we want `hello`.
    
    # Strategy:
    # A. If we see `[Translated: ... ]`, extract the content inside?
    # B. Or assume the user wants to remove "artifacts" meaning the *tag* itself?
    # The user said "Remove any translation-related artifacts such as: '[Translated: ...]'".
    # This implies removing the *tag* and potentially the original text if it's mixed?
    # "Ensure that only clean, readable English sentences are stored."
    
    # Let's try to be smart.
    # If the text contains `[Translated:`, it might be the old format `Original [Translated: English]`.
    # In that case, we want to KEEP "English" and REMOVE "Original" and "[Translated: ]".
    # Regex: `.*?\[Translated:\s*(.*?)\].*` -> replace with group 1?
    
    match = re.search(r'\[Translated:\s*(.*?)\]', text, flags=re.IGNORECASE)
    if match:
        # If we find the tag, assume the text inside is the clean English version we want.
        # This handles the `Original [Translated: English]` case by discarding the "Original".
        text = match.group(1)
    
    # Also handle (Translated: ...) just in case
    match_paren = re.search(r'\(Translated:\s*(.*?)\)', text, flags=re.IGNORECASE)
    if match_paren:
        text = match_paren.group(1)

    # 2. Remove "Translated:" prefix if it appears alone (e.g. "Translated: Hello")
    text = re.sub(r'^\s*Translated\s*:\s*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\s*Translated\s*:\s*', ' ', text, flags=re.IGNORECASE)

    # 3. Remove non-ASCII characters (specifically Devanagari and Tamil blocks)
    # Devanagari: \u0900-\u097F
    # Tamil: \u0B80-\u0BFF
    text = re.sub(r'[\u0900-\u097F]+', '', text) 
    text = re.sub(r'[\u0B80-\u0BFF]+', '', text) 

    # 4. Clean up brackets that might remain if they didn't match the "Translated:" pattern
    # e.g. empty brackets
    text = re.sub(r'\[\s*\]', '', text)
    text = re.sub(r'\(\s*\)', '', text)
    
    # 5. Collapse multiple spaces and strip
    text = re.sub(r'\s+', ' ', text).strip()

    return text
