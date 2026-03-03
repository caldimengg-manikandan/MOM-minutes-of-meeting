def extract_mom(text: str):
    sentences = text.split(".")
    mom = []

    for s in sentences:
        s = s.strip()
        if not s:
            continue
            
        # Filter out very short sentences (less than 3 words)
        # to avoid capturing noise or non-substantive remarks.
        if len(s.split()) < 3:
            continue

        # Simple keyword matching for action items
        is_action = any(k in s.lower() for k in ["will", "need to", "should", "action", "task", "assigned to"])
        
        category = "Action Item" if is_action else "Discussion"
        
        # Simple extraction for owner (very basic)
        owner = "Team"
        if "assigned to" in s.lower():
            try:
                owner = s.lower().split("assigned to")[1].strip().split(" ")[0].capitalize()
            except:
                pass

        mom.append({
            "point": s,
            "owner": owner,
            "deadline": "TBD",
            "status": "open",
            "category": category
        })

    return mom
