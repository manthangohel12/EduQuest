from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
from dotenv import load_dotenv
import os
import logging
import requests
import json

from services.text_simplifier import TextSimplifier
from services.quiz_generator import QuizGenerator

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

class StudyChatRequest(BaseModel):
    question: str
    context: Optional[str] = None

class StudyChatResponse(BaseModel):
    answer: str
    is_study_related: bool
    model: str

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
        result = quiz_generator.generate_quiz(
            content=request.content,
            num_questions=request.num_questions,
            difficulty=request.difficulty,
            question_types=request.question_types
        )
        
        # Transform the result to match QuizResponse model
        return QuizResponse(
            questions=result.get("questions", []),
            total_questions=result.get("metadata", {}).get("total_questions", 0),
            estimated_difficulty=result.get("metadata", {}).get("difficulty", "medium")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")

def _call_ollama_study_chat(question: str, context: Optional[str] = None) -> Dict[str, Any]:
    """Call local Ollama Mistral to respond to study questions and enforce domain restriction.

    Returns a dict with keys: answer (str), is_study_related (bool), model (str)
    """
    ollama_url = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
    model_name = os.getenv("STUDYCHAT_MODEL", "mistral:7b-instruct-q2_K")

    # Keep context reasonably sized
    safe_context = (context or "").strip()
    if len(safe_context) > 4000:
        safe_context = safe_context[:4000]

    system_instructions = (
        "You are EduQuest StudyChat, an AI tutor. Only answer study-related questions. "
        "If the question is unrelated to studying, education, or the provided content, respond with a short refusal. "
        "Use the provided Context if relevant. Keep answers concise and helpful (under 200 words)."
    )

    prompt = f"""
{system_instructions}

Return ONLY valid JSON with these keys and no additional text:
{{
  "is_study_related": true | false,
  "answer": "<your helpful answer or short refusal>"
}}

Context (may be empty):
{safe_context}

Question:
{question}
"""

    payload = {
        "model": model_name,
        "prompt": prompt,
        "stream": False,
        "options": {
            "num_predict": 400,
            "temperature": 0.2,
            "top_k": 30,
            "top_p": 0.85,
            "num_ctx": 4096,
            "repeat_penalty": 1.15,
            "num_gpu": -1,
            "num_thread": 0,
        },
    }

    try:
        resp = requests.post(f"{ollama_url}/api/generate", json=payload, timeout=60)
        if resp.status_code != 200:
            raise Exception(f"Ollama error {resp.status_code}: {resp.text}")
        data = resp.json()
        text = (data or {}).get("response", "").strip()
        # Extract JSON from the response
        obj_start = text.find("{")
        obj_end = text.rfind("}") + 1
        if obj_start != -1 and obj_end > obj_start:
            json_str = text[obj_start:obj_end]
            parsed = json.loads(json_str)
            return {
                "answer": str(parsed.get("answer", ""))[:2000],
                "is_study_related": bool(parsed.get("is_study_related", True)),
                "model": model_name,
            }
        # Fallback if parsing fails
        return {
            "answer": "I'm here to help with study-related questions. Please ask something related to your studies or the provided content.",
            "is_study_related": False,
            "model": model_name,
        }
    except Exception as e:
        logger.error(f"StudyChat Ollama call failed: {e}")
        return {
            "answer": "The AI tutor is temporarily unavailable. Please try again in a moment.",
            "is_study_related": True,
            "model": model_name,
        }

def _call_gemini_study_chat(question: str, context: Optional[str] = None) -> Dict[str, Any]:
    """Call Google Gemini to respond to study questions and enforce domain restriction.

    Returns a dict with keys: answer (str), is_study_related (bool), model (str)
    """
    api_key = os.getenv("GEMINI_API_KEY")
    model_name = os.getenv("STUDYCHAT_GEMINI_MODEL", "gemini-1.5-flash")

    # Keep context reasonably sized
    safe_context = (context or "").strip()
    if len(safe_context) > 4000:
        safe_context = safe_context[:4000]

    system_instructions = (
        "You are EduQuest StudyChat, an AI tutor. Only answer study-related questions. "
        "If the question is unrelated to studying, education, or the provided content, respond with a short refusal. "
        "Use the provided Context if relevant. Keep answers concise and helpful (under 200 words)."
    )

    prompt = f"""
{system_instructions}

Return ONLY valid JSON with these keys and no additional text:
{{
  "is_study_related": true | false,
  "answer": "<your helpful answer or short refusal>"
}}

Context (may be empty):
{safe_context}


Question:
{question}
"""

    try:
        if not api_key:
            raise Exception("GEMINI_API_KEY not set")

        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name=model_name)
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.2,
                "max_output_tokens": 600,
                "top_k": 30,
                "top_p": 0.85,
            },
        )
        text = (getattr(response, "text", None) or "").strip()
        # Extract JSON from the response
        obj_start = text.find("{")
        obj_end = text.rfind("}") + 1
        if obj_start != -1 and obj_end > obj_start:
            json_str = text[obj_start:obj_end]
            parsed = json.loads(json_str)
            return {
                "answer": str(parsed.get("answer", ""))[:2000],
                "is_study_related": bool(parsed.get("is_study_related", True)),
                "model": model_name,
            }
        # Fallback if parsing fails
        return {
            "answer": "I'm here to help with study-related questions. Please ask something related to your studies or the provided content.",
            "is_study_related": False,
            "model": model_name,
        }
    except Exception as e:
        logger.error(f"StudyChat Gemini call failed: {e}")
        return {
            "answer": "The AI tutor is temporarily unavailable. Please try again in a moment.",
            "is_study_related": True,
            "model": model_name,
        }

@app.post("/study-chat/respond", response_model=StudyChatResponse)
async def study_chat_respond(request: StudyChatRequest):
    """Generate a study-related response using Gemini (default) with fallback to Ollama.

    The model is instructed to refuse unrelated questions. The response contains a
    boolean flag indicating whether the question was study-related.
    """
    try:
        if not request.question or not request.question.strip():
            raise HTTPException(status_code=400, detail="Question is required")

        provider = os.getenv("STUDYCHAT_PROVIDER", "gemini").lower()

        if provider == "ollama":
            result = _call_ollama_study_chat(request.question.strip(), request.context)
        else:
            # Try Gemini first
            result = _call_gemini_study_chat(request.question.strip(), request.context)
            # If Gemini returns the generic unavailable message and provider is explicitly ollama fallback, try Ollama
            if not result.get("answer") or result.get("answer", "").startswith("The AI tutor is temporarily unavailable"):
                # Optional fallback to Ollama if configured
                try:
                    result = _call_ollama_study_chat(request.question.strip(), request.context)
                except Exception:
                    pass

        return StudyChatResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"StudyChat failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "text_simplifier": "available",
            "quiz_generator": "available"
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    ) 