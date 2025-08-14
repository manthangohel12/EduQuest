from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
from dotenv import load_dotenv
import os
import logging

from services.text_simplifier import TextSimplifier
from services.quiz_generator import QuizGenerator
from services.progress_predictor import ProgressPredictor

load_dotenv()

app = FastAPI(
    title="EduQuest AI Services",
    description="AI-powered learning services for EduQuest platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI services
text_simplifier = TextSimplifier()
quiz_generator = QuizGenerator()
progress_predictor = ProgressPredictor()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global exception handler
@app.exception_handler(UnicodeDecodeError)
async def unicode_decode_exception_handler(request, exc):
    logger.error(f"Unicode decode error: {str(exc)}")
    return JSONResponse(
        status_code=400,
        content={"detail": "File contains invalid characters. Please check the file encoding."}
    )

# Pydantic models
class SimplifyRequest(BaseModel):
    text: str
    difficulty_level: Optional[str] = "intermediate"
    target_audience: Optional[str] = "student"

class SimplifyResponse(BaseModel):
    simplified_text: str
    summary: str
    original_complexity: float
    simplified_complexity: float
    key_concepts: List[str]
    explanations: List[str]
    original_text: str
    difficulty_level: str
    target_audience: str
    complexity_metrics: Dict[str, Any]

class FileProcessResponse(BaseModel):
    simplified_text: str
    summary: str
    original_complexity: float
    simplified_complexity: float
    key_concepts: List[str]
    explanations: List[str]
    original_text: str
    difficulty_level: str
    target_audience: str
    complexity_metrics: Dict[str, Any]
    file_metadata: Dict[str, Any]
    filename: str

class QuizRequest(BaseModel):
    content: str
    num_questions: int = 5
    difficulty: str = "medium"
    question_types: List[str] = ["multiple_choice"]

class QuizResponse(BaseModel):
    questions: List[dict]
    total_questions: int
    estimated_difficulty: str

class ProgressRequest(BaseModel):
    user_id: str
    subject: str
    current_score: float
    study_time: float
    completed_lessons: int

class ProgressResponse(BaseModel):
    predicted_score: float
    recommended_topics: List[str]
    study_recommendations: List[str]
    confidence: float

@app.get("/")
async def root():
    return {"message": "EduQuest AI Services API", "version": "1.0.0"}

@app.post("/simplify", response_model=SimplifyResponse)
async def simplify_text(request: SimplifyRequest):
    """Simplify complex text using AI"""
    try:
        result = await text_simplifier.simplify(
            text=request.text,
            difficulty_level=request.difficulty_level,
            target_audience=request.target_audience
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text simplification failed: {str(e)}")

@app.post("/process-file", response_model=FileProcessResponse)
async def process_file(
    file: UploadFile = File(...),
    difficulty_level: str = "intermediate",
    target_audience: str = "student"
):
    """Process uploaded file and extract/simplify content"""
    try:
        # Read file content
        file_content = await file.read()
        
        # Validate file size (10MB limit)
        if len(file_content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")
        
        # Validate file type
        allowed_extensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.md', '.html', '.htm']
        file_extension = os.path.splitext(file.filename)[1].lower()
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        logger.info(f"Processing file: {file.filename}, size: {len(file_content)} bytes")
        
        result = await text_simplifier.process_file(
            file_content=file_content,
            filename=file.filename,
            difficulty_level=difficulty_level,
            target_audience=target_audience
        )
        
        logger.info(f"File processing completed successfully: {file.filename}")
        return result
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except UnicodeDecodeError as e:
        logger.error(f"Unicode decode error processing file {file.filename}: {str(e)}")
        raise HTTPException(
            status_code=400, 
            detail="File contains invalid characters. Please check the file encoding."
        )
    except Exception as e:
        # Log the error for debugging
        logger.error(f"File processing error for {file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"File processing failed: {str(e)}")

@app.get("/supported-formats")
async def get_supported_formats():
    """Get list of supported file formats"""
    try:
        formats = text_simplifier.get_supported_file_formats()
        return {"supported_formats": formats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get supported formats: {str(e)}")

@app.post("/generate-quiz", response_model=QuizResponse)
async def generate_quiz(request: QuizRequest):
    """Generate quiz questions from content"""
    try:
        result = await quiz_generator.generate_quiz(
            content=request.content,
            num_questions=request.num_questions,
            difficulty=request.difficulty,
            question_types=request.question_types
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")

@app.post("/predict-progress", response_model=ProgressResponse)
async def predict_progress(request: ProgressRequest):
    """Predict learning progress and provide recommendations"""
    try:
        result = await progress_predictor.predict_progress(
            user_id=request.user_id,
            subject=request.subject,
            current_score=request.current_score,
            study_time=request.study_time,
            completed_lessons=request.completed_lessons
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Progress prediction failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "text_simplifier": "available",
            "quiz_generator": "available",
            "progress_predictor": "available"
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    ) 