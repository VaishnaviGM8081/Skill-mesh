from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
import os
import tempfile
import json
from openai import OpenAI
import spacy
from typing import Optional, Dict
from extractor import extract_job_details

app = FastAPI(title="SkillMesh ML Services")

# Load a small English model for demo purposes.
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    nlp = None

class IntentRequest(BaseModel):
    description: str

class IntentResponse(BaseModel):
    trade_category: Optional[str]
    location: Optional[str]
    urgency: str
    confidence_score: float

class FraudRequest(BaseModel):
    account_age_days: int
    ratings_given_today: int
    has_completed_job_with_worker: bool
    rating_value: int
    time_since_job_completion: int

class FraudResponse(BaseModel):
    risk_score: float
    is_fraudulent: bool

class PricingRequest(BaseModel):
    trade_category: str
    distance_km: float
    time_of_day: str  # morning, afternoon, evening
    locality_demand_index: float
    worker_rating: float

class PricingResponse(BaseModel):
    min_price: float
    suggested_price: float
    max_price: float

class ExtractRequest(BaseModel):
    description: str

class ExtractResponse(BaseModel):
    skill: str
    intent: str
    urgency: str

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/extract", response_model=ExtractResponse)
def extract_endpoint(req: ExtractRequest):
    return extract_job_details(req.description)

@app.post("/parse-intent", response_model=IntentResponse)
def parse_intent(req: IntentRequest):
    # Mock NLP Intent Parsing (Hinglish Support stub)
    text = req.description.lower()
    trade = None
    urgency = "normal"
    
    trades_map = ["plumber", "electrician", "carpenter", "painter"]
    for t in trades_map:
        if t in text:
            trade = t
            break
            
    if "urgent" in text or "jaldi" in text or "fast" in text:
        urgency = "high"
        
    loc = "BTM Layout" if "btm" in text else "Koramangala" if "koramangala" in text else None
    
    return IntentResponse(
        trade_category=trade,
        location=loc,
        urgency=urgency,
        confidence_score=0.85 if trade else 0.4
    )

@app.post("/detect-fraud", response_model=FraudResponse)
def detect_fraud(req: FraudRequest):
    # Mock Logic for Isolation forest
    score = 0.1
    if req.ratings_given_today > 5: score += 0.4
    if not req.has_completed_job_with_worker: score += 0.5
    if req.account_age_days < 2 and req.rating_value == 5: score += 0.3
    
    risk = min(score, 1.0)
    return FraudResponse(risk_score=risk, is_fraudulent=(risk > 0.75))

@app.post("/api/pricing/estimate", response_model=PricingResponse)
def estimate_pricing(req: PricingRequest):
    # Mock dynamic pricing based on regression features
    base_rate = 300
    if req.trade_category == 'electrician': base_rate = 400
    
    multiplier = 1.0
    if req.time_of_day == 'evening': multiplier = 1.2
    multiplier += (req.locality_demand_index * 0.1)
    
    dist_addon = req.distance_km * 10
    
    calc = (base_rate + dist_addon) * multiplier
    return PricingResponse(
        min_price=calc * 0.8,
        suggested_price=calc,
        max_price=calc * 1.3
    )

import whisper
import torch

# Load Whisper model (base model is fast and works well with WAV conversion)
WHISPER_MODEL_NAME = "base"
print(f"Loading Whisper model '{WHISPER_MODEL_NAME}'...")
whisper_model = whisper.load_model(WHISPER_MODEL_NAME)

@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        # Create a temporary file to save the uploaded audio
        with tempfile.NamedTemporaryFile(delete=False, suffix=".m4a") as tmp_file:
            content = await file.read()
            file_size = len(content)
            print(f"Received audio file, size: {file_size} bytes")
            if file_size < 100:
                return {"text": ""}
            tmp_file.write(content)
            tmp_path = tmp_file.name
            
        print(f"Transcribing audio file: {tmp_path}")
        
        # Check if OpenAI API Key is available
        api_key = os.environ.get("OPENAI_API_KEY")
        if api_key:
            print("Using OpenAI Whisper API")
            try:
                client = OpenAI(api_key=api_key)
                with open(tmp_path, "rb") as audio_file:
                    transcript = client.audio.transcriptions.create(
                        model="whisper-1", 
                        file=audio_file
                    )
                os.unlink(tmp_path)
                return {"text": transcript.text}
            except Exception as api_err:
                print(f"OpenAI API failed: {api_err}")

        # Local Whisper - Convert to WAV first for better compatibility
        print("Using local Whisper model (converting to WAV)")
        wav_path = tmp_path.replace(".m4a", ".wav")
        os.system(f"ffmpeg -y -i {tmp_path} -ar 16000 -ac 1 -c:a pcm_s16le {wav_path} > /dev/null 2>&1")
        
        # Initial prompt to guide the model with Hinglish and service context
        prompt = "I need a plumber or electrician for a leak in my tap or a short circuit. Jaldi aao."
        result = whisper_model.transcribe(wav_path, initial_prompt=prompt)
        
        # Clean up
        if os.path.exists(tmp_path): os.unlink(tmp_path)
        if os.path.exists(wav_path): os.unlink(wav_path)
        
        return {"text": result["text"].strip()}
        
    except Exception as e:
        print("Transcription error:", str(e))
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Speech-to-text failed: {str(e)}")

# Smart Pricing Model (Mock Logic for Bengaluru Market)
PRICE_MARKET_DATA = {
    "plumber": {"base": 300, "multiplier": 1.2, "range": (300, 1500)},
    "electrician": {"base": 250, "multiplier": 1.5, "range": (250, 2000)},
    "carpenter": {"base": 400, "multiplier": 1.1, "range": (400, 3000)},
    "painter": {"base": 500, "multiplier": 2.0, "range": (1000, 10000)},
    "ac_technician": {"base": 450, "multiplier": 1.3, "range": (450, 2500)}
}

class PriceRequest(BaseModel):
    category: str
    description: str

@app.post("/api/price-suggestion")
async def get_price_suggestion(request: PriceRequest):
    cat = request.category.lower()
    desc = request.description.lower()
    
    if cat not in PRICE_MARKET_DATA:
        return {"suggested_min": 300, "suggested_max": 800, "currency": "INR"}
    
    data = PRICE_MARKET_DATA[cat]
    suggested_min = data["base"]
    
    # Simple logic: increase price if certain keywords are present
    if "urgent" in desc or "emergency" in desc:
        suggested_min += 200
    if "replacement" in desc or "new" in desc:
        suggested_min += 300
    if "repair" in desc:
        suggested_min += 100
        
    suggested_max = int(suggested_min * data["multiplier"])
    
    # Clamp to realistic ranges
    suggested_min = max(suggested_min, data["range"][0])
    suggested_max = min(suggested_max, data["range"][1])
    
    return {
        "suggested_min": suggested_min,
        "suggested_max": suggested_max,
        "currency": "INR",
        "note": "Based on Bengaluru market averages"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
