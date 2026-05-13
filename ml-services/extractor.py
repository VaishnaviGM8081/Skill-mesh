import spacy

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    nlp = None

def extract_job_details(description: str):
    text = description.lower()
    
    skill = "general worker"
    intent = "general service"
    urgency = "normal"
    
    # Skill & Intent Mapping
    if any(k in text for k in ["tiles", "tiling"]):
        skill = "tiles worker"
        intent = "tile installation"
    elif any(k in text for k in ["wiring", "switch", "electric"]):
        skill = "electrician"
        intent = "electrical repair"
    elif any(k in text for k in ["pipe", "leak", "tap", "plumb"]):
        skill = "plumber"
        intent = "plumbing service"
    elif any(k in text for k in ["paint", "wall painting"]):
        skill = "painter"
        intent = "painting"
    elif any(k in text for k in ["wood", "furniture", "door repair"]):
        skill = "carpenter"
        intent = "carpentry"
        
    # Urgency Mapping
    urgency_keywords = ["urgent", "immediately", "asap", "tonight", "emergency", "urgently"]
    if any(u in text for u in urgency_keywords):
        urgency = "high"
        
    return {
        "skill": skill,
        "intent": intent,
        "urgency": urgency
    }
