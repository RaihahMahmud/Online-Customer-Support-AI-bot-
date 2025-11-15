from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging

# Import our modules
from app.perception import PerceptionModule
from app.decision import DecisionModule
from app.action import ActionModule

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize the app
app = FastAPI(
    title="AI Agent API",
    description="A customizable AI agent with natural language processing capabilities",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize modules
perception = PerceptionModule()
decision = DecisionModule()
action = ActionModule()

# Request/Response models
class AgentRequest(BaseModel):
    input_text: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None

class AgentResponse(BaseModel):
    response: str
    confidence: float
    success: bool
    intent: Optional[str] = None
    action: Optional[str] = None
    processed_text: Optional[str] = None

class HealthCheck(BaseModel):
    status: str
    model_loaded: bool

# API endpoints
@app.get("/", response_model=HealthCheck)
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": decision.model is not None
    }

@app.post("/process", response_model=AgentResponse)
async def process_input(request: AgentRequest):
    """Process user input and return AI response"""
    try:
        logger.info(f"Processing request: {request.input_text}")
        
        # Process through all modules
        features = perception.process_text(request.input_text)
        intent_id = decision.predict_intent(features)
        intent_label = decision.get_intent_label(intent_id)
        result = action.execute(intent_id, features)
        
        logger.info(f"Intent detected: {intent_label}, Action: {result.get('action')}")
        
        return AgentResponse(
            response=result.get("response", "I'm not sure how to respond."),
            confidence=result.get("confidence", 0.5),
            success=True,
            intent=intent_label,
            action=result.get("action"),
            processed_text=features.get("processed_text")
        )
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/intents")
async def list_intents():
    """Return available intents the AI can recognize"""
    return {"intents": decision.intent_labels}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)