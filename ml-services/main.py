from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import spacy
from typing import Optional, Dict

app = FastAPI(title="SkillMesh ML Services")

# Load a small English model for demo purposes.
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    nlp = None

class IntentRequest(BaseModel):
    text: str

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

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/parse-intent", response_model=IntentResponse)
def parse_intent(req: IntentRequest):
    # Mock NLP Intent Parsing (Hinglish Support stub)
    text = req.text.lower()
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
