# pyrefly: ignore [missing-import]
from fastapi import APIRouter
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field
from typing import List
from match_service import matcher_service

router = APIRouter(tags=["Worker Matching"])

class MatchRequest(BaseModel):
    distance_km: float = Field(..., description="Distance between worker and job location (km)")
    skill_match_score: float = Field(..., description="Skill match score (0.0 to 1.0)")
    price_ratio: float = Field(..., description="Worker's hourly rate / Job's expected rate")
    worker_rating: float = Field(..., description="Worker's average rating (1.0 to 5.0)")
    worker_jobs_completed: int = Field(..., description="Total jobs completed by the worker")

    model_config = {
        "json_schema_extra": {
            "example": {
                "distance_km": 12.5,
                "skill_match_score": 0.85,
                "price_ratio": 0.95,
                "worker_rating": 4.8,
                "worker_jobs_completed": 42
            }
        }
    }

class MatchResponse(BaseModel):
    match_score: float = Field(..., description="Predicted match score out of 100")
    is_recommended: bool = Field(..., description="Whether this is considered a recommended match")
    explainability: List[str] = Field(..., description="Explainable reasons for the match score")

    model_config = {
        "json_schema_extra": {
            "example": {
                "match_score": 88.5,
                "is_recommended": True,
                "explainability": [
                    "Excellent skill match.",
                    "Worker is highly cost-effective.",
                    "Worker has a stellar rating.",
                    "Worker is highly experienced on the platform."
                ]
            }
        }
    }

@router.post("/match-worker", response_model=MatchResponse)
def match_worker(req: MatchRequest):
    features = req.model_dump()
    prediction = matcher_service.match(features)
    
    return MatchResponse(
        match_score=prediction["match_score"],
        is_recommended=prediction["is_recommended"],
        explainability=prediction["explainability"]
    )
