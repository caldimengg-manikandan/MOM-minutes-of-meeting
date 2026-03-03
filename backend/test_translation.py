from app.utils.translator import translate_text

def test_translation():
    print("Testing Translation Logic...")
    
    # Test Hindi -> English
    text_hi = "नमस्ते दुनिया" # Hello World
    print(f"Translating Hindi: '{text_hi}'")
    res_hi = translate_text(text_hi, "hi", "en", use_online=False)
    print(f"Result (Offline): {res_hi}")

    # Test Tamil -> English
    text_ta = "வணக்கம்" # Hello
    print(f"Translating Tamil: '{text_ta}'")
    res_ta = translate_text(text_ta, "ta", "en", use_online=False)
    print(f"Result (Offline): {res_ta}")

if __name__ == "__main__":
    test_translation()
