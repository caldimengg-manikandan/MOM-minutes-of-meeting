from app.utils.translator import translate_text

def test_online_translation():
    print("Testing Online Translation Logic...")
    
    # Test Tamil -> English (Online)
    text_ta = "வணக்கம்" # Hello
    print(f"Translating Tamil (Online): '{text_ta}'")
    try:
        res_ta = translate_text(text_ta, "ta", "en", use_online=True)
        print(f"Result (Online): {res_ta}")
    except Exception as e:
        print(f"Online Translation Failed: {e}")

if __name__ == "__main__":
    test_online_translation()
