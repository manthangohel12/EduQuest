import re
import random
from typing import List, Dict, Any
import spacy
from collections import Counter
import subprocess
import json
import requests
import asyncio
import aiohttp
from concurrent.futures import ThreadPoolExecutor
import time
import os
from openai import OpenAI

class QuizGenerator:
    def __init__(self, question_model: str = "mistral:7b-instruct-q2_K", option_model: str = "mistral:7b-instruct-q2_K", 
                 use_ai_models: bool = True, fast_mode: bool = False, ollama_url: str = "http://127.0.0.1:11434",
                 openai_api_key: str = None, openai_model: str = "gpt-3.5-turbo", use_openai_fallback: bool = True, gemini_api_key: str = None,
                 gemini_model: str = "gemini-1.5-flash", use_gemini_fallback: bool = True):
        self.nlp = None
        self._load_nlp()
        self.question_model = question_model
        self.option_model = option_model
        self.use_ai_models = use_ai_models
        self.fast_mode = fast_mode
        self.ollama_url = ollama_url
        self.ai_models_available = False
        self.executor = ThreadPoolExecutor(max_workers=2)
        self.common_words = {
            "thing", "something", "someone", "people", "important", "different", 
            "various", "number", "many", "much", "several", "type"
        }
        
        # OpenAI configuration
        self.use_openai_fallback = use_openai_fallback
        self.openai_model = openai_model
        self.openai_client = None
        self.openai_available = False

       # Gemini configuration
        self.use_gemini_fallback = use_gemini_fallback
        self.gemini_model = gemini_model
        self.gemini_available = False
        self.gemini_client = None

        if self.use_gemini_fallback:
            self._initialize_gemini(gemini_api_key)


        
        # Initialize OpenAI if enabled
        if self.use_openai_fallback:
            self._initialize_openai(openai_api_key)
        
        # Model performance tracking and caching
        self.model_performance = {}
        self.model_cache = {}
        
        # Check if AI models are available on initialization
        if self.use_ai_models and not self.fast_mode:
            self._check_ai_models_availability()
            if self.ai_models_available:
                self._preload_models()
        else:
            print("🚀 Fast mode enabled - using NLP-based generation for speed")

    def _initialize_gemini(self, api_key: str = None):
        """Initialize Gemini client"""
        try:
            import google.generativeai as genai
            if api_key:
                genai.configure(api_key=api_key)
            elif os.getenv("GEMINI_API_KEY"):
                genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
            else:
                print("⚠️ Gemini API key not provided - Gemini fallback disabled")
                self.use_gemini_fallback = False
                return

            # Test Gemini availability
            model = genai.GenerativeModel(self.gemini_model)
            response = model.generate_content("Test")
            if response and response.text:
                self.gemini_available = True
                self.gemini_client = model
                print(f"✅ Gemini fallback available: {self.gemini_model}")
            else:
                raise Exception("No response from Gemini")

        except Exception as e:
            print(f"⚠️ Gemini initialization failed: {e}")
            self.use_gemini_fallback = False
            self.gemini_available = False
            self.gemini_client = None
    

    def _call_gemini_api(self, prompt: str, max_tokens: int = 300, temperature: float = 0.3) -> str:
        """Call Gemini API with error handling"""
        if not self.gemini_available or not self.gemini_client:
            return ""

        try:
            response = self.gemini_client.generate_content(
                prompt,
                generation_config={
                    "temperature": temperature,
                    "max_output_tokens": max_tokens
                }
            )
            return response.text.strip() if response and response.text else ""
        except Exception as e:
            print(f"🔴 Gemini API error: {e}")
            return ""


    def _load_nlp(self):
        """Load spaCy model for NLP processing"""
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            try:
                subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"], 
                             timeout=60, check=True)
                self.nlp = spacy.load("en_core_web_sm")
            except Exception as e:
                print(f"Warning: Could not load spaCy model. Using basic text processing. Error: {e}")
                self.nlp = None

    def _initialize_openai(self, api_key: str = None):
        """Initialize OpenAI client"""
        try:
            # Try to get API key from parameter, environment, or config
            if api_key:
                self.openai_client = OpenAI(api_key=api_key)
            elif os.getenv("OPENAI_API_KEY"):
                self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            else:
                print("⚠️ OpenAI API key not provided - OpenAI fallback disabled")
                self.use_openai_fallback = False
                return
            
            # Test OpenAI availability
            test_response = self.openai_client.chat.completions.create(
                model=self.openai_model,
                messages=[{"role": "user", "content": "Test"}],
                max_tokens=5,
                timeout=10
            )
            
            if test_response and test_response.choices:
                self.openai_available = True
                print(f"✅ OpenAI fallback available: {self.openai_model}")
            else:
                raise Exception("No response from OpenAI")
                
        except Exception as e:
            print(f"⚠️ OpenAI initialization failed: {e}")
            self.use_openai_fallback = False
            self.openai_available = False
            self.openai_client = None

    def _call_openai_api(self, prompt: str, max_tokens: int = 300, temperature: float = 0.3) -> str:
        """Call OpenAI API with error handling"""
        if not self.openai_available or not self.openai_client:
            return ""
        
        # Check cache first
        cache_key = f"openai:{hash(prompt[:200])}"
        if cache_key in self.model_cache:
            return self.model_cache[cache_key]
        
        try:
            response = self.openai_client.chat.completions.create(
                model=self.openai_model,
                messages=[
                    {"role": "system", "content": "You are an expert quiz generator. Always return valid JSON when requested."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature,
                timeout=30
            )
            
            if response and response.choices and len(response.choices) > 0:
                content = response.choices[0].message.content.strip()
                # Cache the response
                self.model_cache[cache_key] = content
                return content
            else:
                return ""
                
        except Exception as e:
            print(f"🔴 OpenAI API error: {e}")
            return ""

    def _check_ai_models_availability(self):
        """Check if Ollama API and models are available with GPU support"""
        try:
            response = requests.get(f"{self.ollama_url}/api/tags", timeout=10)
            
            if response.status_code == 200:
                models_data = response.json()
                available_models = [model['name'] for model in models_data.get('models', [])]
                
                has_question_model = any(self.question_model in model for model in available_models)
                has_option_model = any(self.option_model in model for model in available_models)
                
                if has_question_model and has_option_model:
                    test_result = self._quick_api_test()
                    if test_result:
                        self.ai_models_available = True
                        print(f"✅ AI models available via API: {self.question_model}, {self.option_model}")
                        self._optimize_model_settings()
                        self._check_gpu_usage()
                    else:
                        self.ai_models_available = False
                        print("⚠️ Models found but API test failed, using fallback mode")
                else:
                    print(f"⚠️ Models not found. Available models: {available_models}")
                    self.ai_models_available = False
            else:
                print("⚠️ Ollama API not responding")
                self.ai_models_available = False
                
        except Exception as e:
            print(f"⚠️ Cannot connect to Ollama API: {e}")
            self.ai_models_available = False

    def _quick_api_test(self) -> bool:
        """Quick test using Ollama API to check responsiveness"""
        try:
            start_time = time.time()
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": self.question_model,
                    "prompt": "Test",
                    "stream": False,
                    "options": {"num_predict": 5}
                },
                timeout=15
            )
            
            response_time = time.time() - start_time
            self.model_performance[self.question_model] = response_time
            
            return response.status_code == 200
        except:
            return False

    def _check_gpu_usage(self):
        """Check if models are using GPU"""
        try:
            response = requests.get(f"{self.ollama_url}/api/ps", timeout=3)
            if response.status_code == 200:
                running_models = response.json().get('models', [])
                for model in running_models:
                    if 'gpu' in str(model).lower() or 'cuda' in str(model).lower():
                        print("🚀 GPU acceleration detected")
                        return
                print("💻 Running on CPU (consider enabling GPU acceleration)")
        except:
            pass

    def _preload_models(self):
        """Preload models to reduce first-call latency"""
        try:
            print("🔥 Preloading models for faster response...")
            
            # Preload question model
            requests.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": self.question_model,
                    "prompt": "Preload test",
                    "stream": False,
                    "options": {"num_predict": 1}
                },
                timeout=30
            )
            
            # If using different model for options, preload it too
            if self.option_model != self.question_model:
                requests.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": self.option_model,
                        "prompt": "Preload test",
                        "stream": False,
                        "options": {"num_predict": 1}
                    },
                    timeout=30
                )
            
            print("✅ Models preloaded successfully")
            
        except Exception as e:
            print(f"⚠️ Model preloading failed: {e}")

    def _optimize_model_settings(self):
        """Optimize model settings for handling variable input sizes"""
        print("⚡ Optimizing model settings for variable content sizes...")
        
        self.optimal_settings = {
            "temperature": 0.2,
            "top_k": 30,
            "top_p": 0.85,
            "num_ctx": 4096,  # Will be adjusted dynamically
            "num_predict": -1,
            "repeat_penalty": 1.15,
            "num_gpu": -1,
            "num_thread": 0,
            "num_batch": 1024,
        }

    def _chunk_content_intelligently(self, content: str, max_chunk_size: int = 2000) -> List[str]:
        """Intelligently chunk content by paragraphs and sentences to preserve context"""
        
        if len(content) <= max_chunk_size:
            return [content]
        
        chunks = []
        
        # First try to split by paragraphs
        paragraphs = content.split('\n\n')
        current_chunk = ""
        
        for paragraph in paragraphs:
            if len(current_chunk) + len(paragraph) > max_chunk_size:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                    current_chunk = ""
                
                # If single paragraph is too large, split by sentences
                if len(paragraph) > max_chunk_size:
                    sentences = re.split(r'(?<=[.!?])\s+', paragraph)
                    temp_chunk = ""
                    
                    for sentence in sentences:
                        if len(temp_chunk) + len(sentence) > max_chunk_size:
                            if temp_chunk:
                                chunks.append(temp_chunk.strip())
                                temp_chunk = ""
                        temp_chunk += sentence + " "
                    
                    if temp_chunk:
                        current_chunk = temp_chunk
                else:
                    current_chunk = paragraph
            else:
                current_chunk += paragraph + "\n\n"
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return [chunk for chunk in chunks if chunk.strip()]

    def _call_ollama_api(self, model_name: str, prompt: str, max_tokens: int = 200) -> str:
        """Enhanced Ollama API call with dynamic optimization"""
        
        if not self.ai_models_available:
            return ""
        
        # Check cache first
        cache_key = f"{model_name}:{hash(prompt[:200])}"
        if cache_key in self.model_cache:
            return self.model_cache[cache_key]
        
        # Dynamic context window adjustment based on content length
        content_length = len(prompt)
        
        if content_length < 1000:
            num_ctx = 2048
            timeout = 30
        elif content_length < 3000:
            num_ctx = 4096
            timeout = 45
        elif content_length < 8000:
            num_ctx = 8192
            timeout = 60
        else:
            num_ctx = 16384
            timeout = 90
        
        try:
            payload = {
                "model": model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_predict": min(max_tokens, 500),
                    "temperature": 0.2,
                    "top_k": 30,
                    "top_p": 0.85,
                    "num_ctx": num_ctx,
                    "repeat_penalty": 1.15,
                    "num_gpu": -1,  # Use all available GPUs
                    "num_thread": 0,  # Let Ollama decide optimal threads
                    "num_batch": 512,  # Reduced for CPU
                }
            }
            
            # Increase timeout for CPU processing
            cpu_timeout = max(timeout, 120)  # Minimum 2 minutes for CPU
            
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json=payload,
                timeout=cpu_timeout,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                result = response.json()
                response_text = result.get('response', '').strip()
                
                # Cache the response
                self.model_cache[cache_key] = response_text
                
                return response_text
            else:
                print(f"API Error {response.status_code}: {response.text}")
                return ""
                
        except requests.exceptions.Timeout:
            print(f"⏱️ API timeout for {model_name} (tried {cpu_timeout}s)")
            # Don't disable AI models on timeout - just return empty for this call
            return ""
        except requests.exceptions.ConnectionError:
            print(f"🔌 Connection error for {model_name}")
            # Only disable AI models on connection errors
            self.ai_models_available = False
            return ""
        except Exception as e:
            print(f"🔴 API error for {model_name}: {e}")
            return ""

    async def _call_ollama_api_async(self, model_name: str, prompt: str, max_tokens: int = 200) -> str:
        """Async version for parallel processing"""
        
        if not self.ai_models_available:
            return ""
        
        # Check cache first
        cache_key = f"{model_name}:{hash(prompt[:200])}"
        if cache_key in self.model_cache:
            return self.model_cache[cache_key]
        
        # Dynamic context window adjustment
        content_length = len(prompt)
        num_ctx = 2048 if content_length < 1000 else 4096 if content_length < 3000 else 8192
        
        payload = {
            "model": model_name,
            "prompt": prompt,
            "stream": False,
            "options": {
                "num_predict": max_tokens,
                "temperature": 0.2,
                "top_k": 30,
                "top_p": 0.85,
                "num_ctx": num_ctx,
                "repeat_penalty": 1.15,
                "num_gpu": -1,
                "num_thread": 0,
            }
        }
        
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=60)) as session:
                async with session.post(
                    f"{self.ollama_url}/api/generate",
                    json=payload,
                    headers={'Content-Type': 'application/json'}
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        response_text = result.get('response', '').strip()
                        # Cache the response
                        self.model_cache[cache_key] = response_text
                        return response_text
                    else:
                        print(f"Async API Error {response.status}")
                        return ""
        except Exception as e:
            print(f"🔴 Async API error: {e}")
            return ""

    def _extract_entities(self, text: str) -> List[str]:
        if not self.nlp:
            return []
        return [ent.text for ent in self.nlp(text).ents]

    def _extract_key_phrases(self, text: str) -> List[str]:
        if not self.nlp:
            return []
        doc = self.nlp(text)
        phrases = [chunk.text.strip() for chunk in doc.noun_chunks if len(chunk.text.split()) <= 4]
        important_words = [
            token.text.strip() for token in doc 
            if token.pos_ in ["NOUN", "PROPN", "ADJ"] and not token.is_stop
        ]
        combined = phrases + important_words
        filtered = [p for p in combined if p.lower() not in self.common_words and len(p) > 2]
        freq = Counter(filtered)
        sorted_terms = [term for term, _ in freq.most_common()]
        return list(dict.fromkeys(sorted_terms))

    def _find_context_sentence(self, text: str, concept: str) -> str:
        sentences = re.split(r'(?<=[.!?])\s+', text)
        for s in sentences:
            if concept.lower() in s.lower():
                return s.strip()
        return sentences[0] if sentences else ""

    def generate_quiz(self, content: str, num_questions: int = 5, difficulty: str = "medium", 
                     question_types: List[str] = None) -> Dict[str, Any]:
        """Main method to generate a complete quiz with enhanced chunking and processing"""
        
        if question_types is None:
            question_types = ["multiple_choice", "true_false", "fill_blank", "short_answer"]
        
        if not content or not content.strip():
            return {
                "questions": [],
                "metadata": {
                    "total_questions": 0,
                    "difficulty": difficulty,
                    "question_types": question_types,
                    "generation_method": "error",
                    "ai_models_used": False,
                    "error": "No content provided"
                }
            }
        
        # Intelligent content chunking for large content
        chunks = self._chunk_content_intelligently(content, max_chunk_size=3000)
        
        all_questions = []
        questions_per_chunk = max(1, num_questions // len(chunks))
        remaining_questions = num_questions
        
        print(f"📄 Processing {len(chunks)} content chunks...")
        
        for i, chunk in enumerate(chunks):
            if remaining_questions <= 0:
                break
            
            chunk_questions = min(questions_per_chunk, remaining_questions)
            if i == len(chunks) - 1:  # Last chunk gets any remaining questions
                chunk_questions = remaining_questions
            
            print(f"🔄 Processing chunk {i+1}/{len(chunks)} ({chunk_questions} questions)...")
            
            # Generate questions for this chunk
            chunk_quiz = self._generate_questions_with_model_a(
                chunk, chunk_questions, difficulty, question_types
            )
            
            # Generate options for each question with better error handling
            for question_data in chunk_quiz:
                if remaining_questions <= 0:
                    break
                
                try:
                    question_with_options = self._generate_options_with_model_b(
                        question_data.get("question", ""),
                        question_data.get("reference_text", ""),
                        question_data.get("type", "multiple_choice"),
                        question_data.get("difficulty", difficulty)
                    )
                    
                    # Validate the generated question
                    if question_with_options and question_with_options.get("question"):
                        all_questions.append(question_with_options)
                        remaining_questions -= 1
                    else:
                        print(f"⚠️ Invalid question generated, skipping...")
                        
                except Exception as e:
                    print(f"⚠️ Error generating options for question: {e}")
                    # Create a basic fallback question
                    fallback_question = {
                        "question": question_data.get("question", "What is the main topic?"),
                        "options": [] if question_data.get("type") in ["short_answer", "fill_blank"] else ["Option A", "Option B", "Option C", "Option D"],
                        "correct_answer": "Based on the content" if question_data.get("type") == "short_answer" else "Option A",
                        "explanation": "This answer is based on the provided content.",
                        "type": question_data.get("type", "multiple_choice"),
                        "difficulty": difficulty
                    }
                    all_questions.append(fallback_question)
                    remaining_questions -= 1
        
        # If we still need more questions, generate them from the full content
        if remaining_questions > 0:
            print(f"📋 Generating {remaining_questions} additional questions from full content...")
            additional_questions = self._generate_questions_with_model_a(
                content[:2000], remaining_questions, difficulty, question_types
            )
            
            for question_data in additional_questions:
                question_with_options = self._generate_options_with_model_b(
                    question_data.get("question", ""),
                    question_data.get("reference_text", ""),
                    question_data.get("type", "multiple_choice"),
                    question_data.get("difficulty", difficulty)
                )
                all_questions.append(question_with_options)
        
        # Ensure we have the requested number of questions
        all_questions = all_questions[:num_questions]
        
        # If still not enough, create basic questions
        if len(all_questions) < num_questions:
            basic_questions = self._create_basic_questions(
                content, num_questions - len(all_questions), difficulty, question_types
            )
            for basic_q in basic_questions:
                question_with_options = self._generate_options_with_model_b(
                    basic_q.get("question", ""),
                    basic_q.get("reference_text", ""),
                    basic_q.get("type", "multiple_choice"),
                    difficulty
                )
                all_questions.append(question_with_options)
        
        return {
            "questions": all_questions,
            "metadata": {
                "total_questions": len(all_questions),
                "difficulty": self._estimate_difficulty(all_questions),
                "question_types": question_types,
                "generation_method": "ai" if (self.ai_models_available or self.openai_available) else "nlp_fallback",
                "ai_models_used": self.ai_models_available,
                "openai_used": self.openai_available and self.use_openai_fallback,
                "content_chunks_processed": len(chunks),
                "fast_mode": self.fast_mode
            }
        }

    def _generate_questions_with_model_a(self, content: str, num_questions: int, difficulty: str, question_types: List[str]) -> List[Dict[str, Any]]:
        """Use Model A (Ollama) to generate questions, with OpenAI fallback"""
        
        # If fast mode, skip AI models entirely
        if self.fast_mode:
            print("🔥 Fast mode - using NLP fallback directly...")
            return self._generate_fallback_questions(content, num_questions, difficulty, question_types)
        
        # Try Ollama first if available
        if self.ai_models_available:
            print(f"🚀 Trying Ollama generation with {self.question_model}...")
            ollama_result = self._try_ollama_question_generation(content, num_questions, difficulty, question_types)
            if ollama_result and len(ollama_result) > 0:
                print(f"✅ Ollama generated {len(ollama_result)} questions successfully")
                return ollama_result
            else:
                print("⚠️ Ollama generation failed, trying OpenAI fallback...")
        
        # Try OpenAI fallback if Ollama failed
        if self.openai_available:
            print(f"🤖 Trying OpenAI generation with {self.openai_model}...")
            openai_result = self._try_openai_question_generation(content, num_questions, difficulty, question_types)
            if openai_result and len(openai_result) > 0:
                print(f"✅ OpenAI generated {len(openai_result)} questions successfully")
                return openai_result
            else:
                print("⚠️ OpenAI generation failed, using Gemini fallback...")
        
       # Try Gemini fallback
        if self.gemini_available:
            print(f"🌐 Trying Gemini generation with {self.gemini_model}...")
            gemini_result = self._try_gemini_question_generation(content, num_questions, difficulty, question_types)
            if gemini_result and len(gemini_result) > 0:
                print(f"✅ Gemini generated {len(gemini_result)} questions successfully")
                return gemini_result
            else:
                print("⚠️ Gemini generation failed, using NLP fallback...")

    def _try_ollama_question_generation(self, content: str, num_questions: int, difficulty: str, question_types: List[str]) -> List[Dict[str, Any]]:
        """Try generating questions with Ollama"""
        try:
            # Optimized prompt for Ollama
            prompt = f"""Generate {num_questions} {difficulty} level quiz questions from this content. Return ONLY valid JSON array.

Content: {content[:1500]}

Format exactly like this:
[{{"question":"What is X?","type":"{question_types[0]}","reference_text":"X is important","difficulty":"{difficulty}"}}]

Requirements:
- {num_questions} questions only
- Type: {question_types[0]}  
- Difficulty: {difficulty}
- Include reference_text from content
- Valid JSON only, no other text
"""

            response = self._call_ollama_api(self.question_model, prompt, max_tokens=800)
            
            if response:
                # Clean the response to extract JSON
                json_start = response.find('[')
                json_end = response.rfind(']') + 1
                if json_start != -1 and json_end > json_start:
                    json_str = response[json_start:json_end]
                    questions = json.loads(json_str)
                    if isinstance(questions, list) and len(questions) > 0:
                        return questions[:num_questions]
            
            return []
            
        except Exception as e:
            print(f"⚠️ Ollama question generation error: {e}")
            return []

    def _try_openai_question_generation(self, content: str, num_questions: int, difficulty: str, question_types: List[str]) -> List[Dict[str, Any]]:
        """Try generating questions with OpenAI"""
        try:
            # Optimized prompt for OpenAI
            prompt = f"""Generate exactly {num_questions} quiz questions from the provided content.

Content:
{content[:2000]}

Requirements:
- Generate exactly {num_questions} questions
- Difficulty level: {difficulty}
- Question types to use: {', '.join(question_types)}
- Each question should include a reference to the source text
- Return as a valid JSON array

Format:
[
  {{
    "question": "Question text here",
    "type": "multiple_choice",
    "reference_text": "Relevant excerpt from content",
    "difficulty": "{difficulty}"
  }}
]

Return ONLY the JSON array, no additional text."""

            response = self._call_openai_api(prompt, max_tokens=1000, temperature=0.3)
            
            if response:
                # Try to extract JSON from response
                json_start = response.find('[')
                json_end = response.rfind(']') + 1
                if json_start != -1 and json_end > json_start:
                    json_str = response[json_start:json_end]
                    questions = json.loads(json_str)
                    if isinstance(questions, list) and len(questions) > 0:
                        # Ensure we have the right number of questions
                        return questions[:num_questions]
            
            return []
            
        except Exception as e:
            print(f"⚠️ OpenAI question generation error: {e}")
            return []

    def _generate_options_with_model_b(self, question: str, reference_text: str, question_type: str, difficulty: str) -> Dict[str, Any]:
        """Use Model B (Ollama) to generate options/answers, with OpenAI fallback"""
        
        # If fast mode, use NLP fallback directly
        if self.fast_mode:
            return self._generate_fallback_options(question, reference_text, question_type, difficulty)
        
        # Try Ollama first if available
        if self.ai_models_available:
            ollama_result = self._try_ollama_option_generation(question, reference_text, question_type, difficulty)
            if ollama_result and ollama_result.get("question"):
                return ollama_result
        
        # Try OpenAI fallback if Ollama failed
        if self.openai_available:
            openai_result = self._try_openai_option_generation(question, reference_text, question_type, difficulty)
            if openai_result and openai_result.get("question"):
                return openai_result
        
        # Final fallback to NLP
        return self._generate_fallback_options(question, reference_text, question_type, difficulty)

    def _try_ollama_option_generation(self, question: str, reference_text: str, question_type: str, difficulty: str) -> Dict[str, Any]:
        """Try generating options with Ollama"""
        try:
            if question_type == "multiple_choice":
                return self._handle_multiple_choice_with_model_b(question, reference_text, difficulty)
            elif question_type == "true_false":
                return self._handle_true_false_with_model_b(question, reference_text, difficulty)
            elif question_type == "fill_blank":
                return self._handle_fill_blank_with_model_b(question, reference_text, difficulty)
            else:
                return self._handle_short_answer_with_model_b(question, reference_text, difficulty)
        except Exception as e:
            print(f"⚠️ Ollama option generation error: {e}")
            return {}

    def _try_openai_option_generation(self, question: str, reference_text: str, question_type: str, difficulty: str) -> Dict[str, Any]:
        """Try generating options with OpenAI"""
        try:
            if question_type == "multiple_choice":
                return self._handle_multiple_choice_with_openai(question, reference_text, difficulty)
            elif question_type == "true_false":
                return self._handle_true_false_with_openai(question, reference_text, difficulty)
            elif question_type == "fill_blank":
                return self._handle_fill_blank_with_openai(question, reference_text, difficulty)
            else:
                return self._handle_short_answer_with_openai(question, reference_text, difficulty)
        except Exception as e:
            print(f"⚠️ OpenAI option generation error: {e}")
            return {}

    def _handle_multiple_choice_with_openai(self, question: str, reference_text: str, difficulty: str) -> Dict[str, Any]:
        """Generate multiple choice options using OpenAI"""
        prompt = f"""Create a multiple choice question with 4 options based on the given question and reference text.

Question: {question}
Reference Text: {reference_text}
Difficulty: {difficulty}

Generate:
1. One correct answer based on the reference text
2. Three plausible but incorrect distractors
3. A brief explanation for the correct answer

Return as JSON:
{{
  "question": "Question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_answer": "The correct option text",
  "explanation": "Why this is correct",
  "type": "multiple_choice",
  "difficulty": "{difficulty}"
}}"""
        
        response = self._call_openai_api(prompt, max_tokens=400)
        
        try:
            # Extract JSON from response
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                result = json.loads(response[json_start:json_end])
                if isinstance(result, dict) and all(key in result for key in ["question", "options", "correct_answer"]):
                    return result
        except json.JSONDecodeError:
            pass
        
        return {}

    def _handle_true_false_with_openai(self, question: str, reference_text: str, difficulty: str) -> Dict[str, Any]:
        """Generate true/false answer using OpenAI"""
        prompt = f"""Analyze this true/false question based on the reference text.

Question: {question}
Reference Text: {reference_text}

Determine if the statement is true or false based on the reference text and provide an explanation.

Return as JSON:
{{
  "question": "Question text",
  "options": [true, false],
  "correct_answer": true or false,
  "explanation": "Explanation based on reference text",
  "type": "true_false",
  "difficulty": "{difficulty}"
}}"""
        
        response = self._call_openai_api(prompt, max_tokens=200)
        
        try:
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                result = json.loads(response[json_start:json_end])
                if isinstance(result, dict) and "correct_answer" in result:
                    return result
        except json.JSONDecodeError:
            pass
        
        return {}

    def _handle_fill_blank_with_openai(self, question: str, reference_text: str, difficulty: str) -> Dict[str, Any]:
        """Generate fill-in-the-blank using OpenAI"""
        prompt = f"""Create or complete a fill-in-the-blank question.

Original Question: {question}
Reference Text: {reference_text}

If the question already has a blank (_____), provide the correct answer.
If not, create a fill-in-the-blank by taking a key sentence and replacing an important word with _____.

Return as JSON:
{{
  "question": "Question with _____ blank",
  "correct_answer": "Word/phrase that fills the blank",
  "explanation": "Why this is the correct answer",
  "type": "fill_blank",
  "difficulty": "{difficulty}"
}}"""
        
        response = self._call_openai_api(prompt, max_tokens=300)
        
        try:
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                result = json.loads(response[json_start:json_end])
                if isinstance(result, dict) and "correct_answer" in result:
                    result["options"] = []  # Fill blank has no multiple choice options
                    return result
        except json.JSONDecodeError:
            pass
        
        return {}

    def _handle_short_answer_with_openai(self, question: str, reference_text: str, difficulty: str) -> Dict[str, Any]:
        """Generate short answer using OpenAI"""
        prompt = f"""Provide a model answer for this short answer question.

Question: {question}
Reference Text: {reference_text}

Provide a concise, accurate answer based on the reference text.

Return as JSON:
{{
  "question": "Question text",
  "correct_answer": "Concise answer",
  "explanation": "Supporting explanation",
  "type": "short_answer",
  "difficulty": "{difficulty}"
}}"""
        
        response = self._call_openai_api(prompt, max_tokens=250)
        
        try:
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                result = json.loads(response[json_start:json_end])
                if isinstance(result, dict) and "correct_answer" in result:
                    result["options"] = []  # Short answer has no multiple choice options
                    return result
        except json.JSONDecodeError:
            pass
        
        return {}

    def _generate_fallback_options(self, question: str, reference_text: str, question_type: str, difficulty: str) -> Dict[str, Any]:
        """Generate options using basic NLP when AI models are unavailable"""
        
        if question_type == "multiple_choice":
            return self._generate_fallback_multiple_choice(question, reference_text, difficulty)
        elif question_type == "true_false":
            return {
                "question": question,
                "options": [True, False],
                "correct_answer": True,
                "explanation": "Based on the reference text.",
                "type": "true_false",
                "difficulty": difficulty
            }
        elif question_type == "fill_blank":
            # Try to extract a word to blank out
            words = reference_text.split() if reference_text else question.split()
            if len(words) > 3:
                # Find a meaningful word to blank out
                meaningful_words = [w for w in words if len(w) > 3 and w.isalpha()]
                if meaningful_words:
                    answer = random.choice(meaningful_words)
                    question_text = reference_text.replace(answer, "_____", 1) if reference_text else f"Fill in the blank: _____ is important."
                else:
                    answer = "answer"
                    question_text = "Fill in the blank: The _____ is important."
            else:
                answer = "answer"
                question_text = "Fill in the blank: The _____ is important."
                
            return {
                "question": question_text,
                "options": [],
                "correct_answer": answer,
                "explanation": "Based on the reference text.",
                "type": "fill_blank",
                "difficulty": difficulty
            }
        else:  # short_answer
            return {
                "question": question,
                "options": [],
                "correct_answer": reference_text[:100] if reference_text else "See reference material",
                "type": "short_answer",
                "difficulty": difficulty
            }

    def _handle_multiple_choice_with_model_b(self, question: str, reference_text: str, difficulty: str) -> Dict[str, Any]:
        """Generate multiple choice options using Model B with GPU optimization"""
        
        # First, try to generate a direct answer to the question
        answer_prompt = f"""Answer the following question based on the reference text. Be concise.

Question: {question}
Reference: {reference_text}

Answer in one or two sentences:"""
        
        # Get a direct answer first
        direct_answer = self._call_ollama_api(self.option_model, answer_prompt, max_tokens=100).strip('"\' ')
        
        if not direct_answer:
            print("⚠️ Could not generate a direct answer, using fallback")
            return self._generate_fallback_multiple_choice(question, reference_text, difficulty)
            
        # Generate distractors (incorrect options)
        distractor_prompt = f"""Generate 3 incorrect but plausible answers to this question. 
The answers should be related to the topic but factually incorrect.

Question: {question}
Correct Answer: {direct_answer}

Return the answers as a JSON array of strings. Example:
["Incorrect Answer 1", "Incorrect Answer 2", "Incorrect Answer 3"]"""
        
        distractor_response = self._call_ollama_api(self.option_model, distractor_prompt, max_tokens=200)
        
        try:
            # Try to parse distractors
            distractor_start = distractor_response.find('[')
            distractor_end = distractor_response.rfind(']') + 1
            if distractor_start != -1 and distractor_end > distractor_start:
                distractors = json.loads(distractor_response[distractor_start:distractor_end])
                if not isinstance(distractors, list) or len(distractors) < 3:
                    raise ValueError("Invalid distractors format")
            else:
                raise ValueError("No valid JSON array found")
                
            # Combine correct answer with distractors
            options = [direct_answer] + distractors[:3]
            random.shuffle(options)
            
            # Generate explanation
            explanation_prompt = f"""Explain why this is the correct answer to the question. Be concise (1-2 sentences).

Question: {question}
Answer: {direct_answer}

Explanation:"""
            explanation = self._call_ollama_api(self.option_model, explanation_prompt, max_tokens=100).strip('"\' ')
            
            return {
                "question": question,
                "options": options,
                "correct_answer": direct_answer,
                "explanation": explanation or "Based on the reference text.",
                "type": "multiple_choice",
                "difficulty": difficulty,
                "reference_text": reference_text
            }
            
        except (json.JSONDecodeError, ValueError, KeyError) as e:
            print(f"⚠️ Option generation failed: {e}, using fallback")
            return self._generate_fallback_multiple_choice(question, reference_text, difficulty)

    def _handle_true_false_with_model_b(self, question: str, reference_text: str, difficulty: str) -> Dict[str, Any]:
        """Generate true/false question using Model B"""
        prompt = f"""
You are creating a true/false question answer. Given a question and reference text, determine if the question statement is true or false based on the reference.

Question: {question}
Reference Text: {reference_text}

Analyze the question against the reference text and return a JSON object:
{{
  "correct_answer": true or false,
  "explanation": "explanation of why this is true or false based on the reference text"
}}

Return ONLY the JSON object, no other text.
"""
        response = self._call_ollama_api(self.option_model, prompt, max_tokens=200)
        
        try:
            result = json.loads(response)
            if isinstance(result, dict) and "correct_answer" in result:
                return {
                    "question": question,
                    "options": [True, False],
                    "correct_answer": result["correct_answer"],
                    "explanation": result.get("explanation", "Based on the reference text."),
                    "type": "true_false",
                    "difficulty": difficulty
                }
        except json.JSONDecodeError:
            print(f"Failed to parse Model B response for true/false")
        
        # Fallback
        return {
            "question": question,
            "options": [True, False],
            "correct_answer": True,
            "explanation": "Based on the reference text.",
            "type": "true_false",
            "difficulty": difficulty
        }

    def _handle_fill_blank_with_model_b(self, question: str, reference_text: str, difficulty: str) -> Dict[str, Any]:
        """Generate fill-in-the-blank answer using Model B"""
        
        prompt = f"""
You are creating a fill-in-the-blank question. Given a question and reference text, you need to:

1. If the question already has a blank (_____), find the correct answer for that blank
2. If the question has NO blank, convert it into a proper fill-in-the-blank format by:
   - Taking a key sentence from the reference text
   - Replacing an important word/phrase with "_____"
   - Making that word/phrase the answer

Original Question: {question}
Reference Text: {reference_text}

Return a JSON object:
{{
  "fill_blank_question": "sentence with _____ where the answer should go",
  "correct_answer": "the exact word or phrase that fills the blank",
  "explanation": "explanation of why this is the correct answer"
}}

Return ONLY the JSON object, no other text.
"""

        response = self._call_ollama_api(self.option_model, prompt, max_tokens=300)
        
        try:
            result = json.loads(response)
            if isinstance(result, dict):
                # Handle both old and new format responses
                if "fill_blank_question" in result:
                    return {
                        "question": result["fill_blank_question"],
                        "options": [],
                        "correct_answer": result["correct_answer"],
                        "explanation": result.get("explanation", "Based on the reference text."),
                        "type": "fill_blank",
                        "difficulty": difficulty
                    }
                elif "correct_answer" in result:
                    return {
                        "question": question,
                        "options": [],
                        "correct_answer": result["correct_answer"],
                        "explanation": result.get("explanation", "Based on the reference text."),
                        "type": "fill_blank",
                        "difficulty": difficulty
                    }
        except json.JSONDecodeError:
            print(f"Failed to parse Model B response for fill blank")
        
        # Fallback
        return {
            "question": question,
            "options": [],
            "correct_answer": "answer",
            "explanation": "Based on the reference text.",
            "type": "fill_blank", 
            "difficulty": difficulty
        }

    def _handle_short_answer_with_model_b(self, question: str, reference_text: str, difficulty: str) -> Dict[str, Any]:
        """Generate short answer using Model B"""
        
        prompt = f"""
You are providing a model answer for a short answer question. Given the question and reference text, provide a concise correct answer.

Question: {question}
Reference Text: {reference_text}

Provide a brief, accurate answer based on the reference text.

Return a JSON object:
{{
  "correct_answer": "concise answer to the question",
  "explanation": "explanation supporting the answer"
}}

Return ONLY the JSON object, no other text.
"""

        response = self._call_ollama_api(self.option_model, prompt, max_tokens=200)
        
        try:
            result = json.loads(response)
            if isinstance(result, dict) and "correct_answer" in result:
                return {
                    "question": question,
                    "options": [],
                    "correct_answer": result["correct_answer"],
                    "explanation": result.get("explanation", "Based on the reference text."),
                    "type": "short_answer",
                    "difficulty": difficulty
                }
        except json.JSONDecodeError:
            print(f"Failed to parse Model B response for short answer")
        
        # Fallback
        return {
            "question": question,
            "options": [],
            "correct_answer": "Sample answer",
            "explanation": "Based on the reference text.",
            "type": "short_answer",
            "difficulty": difficulty
        }

    def _generate_fallback_questions(self, content: str, num_questions: int, difficulty: str, question_types: List[str]) -> List[Dict[str, Any]]:
        """Enhanced fallback method when Model A fails - now more robust"""
        try:
            # Clean and prepare content
            content = content.strip()
            if not content:
                return self._create_emergency_questions(num_questions, difficulty, question_types)
            
            # Try to split by sentences first
            sentences = re.split(r'(?<=[.!?])\s+', content)
            sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 10]
            
            # If no good sentences, try paragraphs
            if not sentences:
                paragraphs = content.split('\n\n')
                sentences = [p.strip() for p in paragraphs if p.strip() and len(p.strip()) > 20]
            
            # If still no luck, split by periods
            if not sentences:
                sentences = [s.strip() + '.' for s in content.split('.') if s.strip() and len(s.strip()) > 10]
            
            # Last resort - create chunks from words
            if not sentences:
                words = content.split()
                sentences = [' '.join(words[i:i+15]) for i in range(0, len(words), 15) if len(words[i:i+15]) > 5]
            
            questions = []
            used_sentences = set()
            
            for i in range(num_questions):
                # Get a unique sentence
                available_sentences = [s for s in sentences if s not in used_sentences]
                if not available_sentences:
                    # Reuse sentences if we run out
                    available_sentences = sentences
                
                if not available_sentences:
                    # Emergency fallback
                    emergency_q = self._create_emergency_questions(num_questions - i, difficulty, question_types)
                    questions.extend(emergency_q)
                    break
                
                sentence = random.choice(available_sentences)
                used_sentences.add(sentence)
                
                question_type = random.choice(question_types) if question_types else "multiple_choice"
                
                try:
                    if question_type == "true_false":
                        question_text = f"True or False: {sentence}"
                    elif question_type == "fill_blank":
                        question_text = self._create_fill_blank_from_sentence(sentence)
                    elif question_type == "short_answer":
                        question_text = f"What is the main idea expressed in: '{sentence[:80]}...'?" if len(sentence) > 80 else f"Explain: {sentence}"
                    else:  # multiple_choice or fallback
                        question_text = f"According to the text, what is stated about this topic: '{sentence[:60]}...'?" if len(sentence) > 60 else f"What does this statement mean: {sentence}"
                    
                    questions.append({
                        "question": question_text,
                        "type": question_type,
                        "reference_text": sentence,
                        "difficulty": difficulty
                    })
                    
                except Exception as e:
                    print(f"Warning: Error creating question {i+1}: {e}")
                    # Create a simple backup question
                    questions.append({
                        "question": f"What is mentioned in the provided text about this topic?",
                        "type": "short_answer",
                        "reference_text": sentence[:200] if sentence else "Sample content",
                        "difficulty": difficulty
                    })
            
            return questions
            
        except Exception as e:
            print(f"Error in fallback question generation: {e}")
            return self._create_emergency_questions(num_questions, difficulty, question_types)

    def _create_fill_blank_from_sentence(self, sentence: str) -> str:
        """Create a fill-in-the-blank question from a sentence"""
        try:
            words = sentence.split()
            if len(words) < 4:
                return f"Complete this statement: {sentence} _____"
            
            # Find meaningful words to blank out (avoid articles, prepositions, etc.)
            meaningful_words = []
            skip_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'by', 'for', 'of', 'to', 'from', 'is', 'was', 'are', 'were', 'be', 'been', 'have', 'has', 'had'}
            
            for i, word in enumerate(words):
                clean_word = re.sub(r'[^\w]', '', word.lower())
                if len(clean_word) > 2 and clean_word not in skip_words and i > 0 and i < len(words) - 1:
                    meaningful_words.append((i, word))
            
            if meaningful_words:
                idx, word_to_blank = random.choice(meaningful_words)
                words[idx] = "_____"
                return " ".join(words)
            else:
                # Fallback: blank out any non-first, non-last word
                blank_idx = random.randint(1, len(words) - 2)
                words[blank_idx] = "_____"
                return " ".join(words)
                
        except Exception:
            return f"Fill in the blank: {sentence.replace(sentence.split()[-1], '_____', 1)}"

    def _create_emergency_questions(self, num_questions: int, difficulty: str, question_types: List[str]) -> List[Dict[str, Any]]:
        """Create basic questions when everything else fails"""
        emergency_questions = []
        
        basic_questions = [
            "What is the main topic discussed in the content?",
            "Which concept is most important in this material?", 
            "What key information is presented?",
            "How would you summarize the main points?",
            "What is the primary focus of this content?"
        ]
        
        for i in range(num_questions):
            question_type = random.choice(question_types) if question_types else "short_answer"
            base_question = basic_questions[i % len(basic_questions)]
            
            if question_type == "true_false":
                question_text = f"True or False: The content discusses important information."
            elif question_type == "fill_blank":
                question_text = "The main topic of this content is _____."
            else:
                question_text = base_question
            
            emergency_questions.append({
                "question": question_text,
                "type": question_type,
                "reference_text": "Content was provided for analysis.",
                "difficulty": difficulty
            })
        
        return emergency_questions

    def _generate_fallback_multiple_choice(self, question: str, reference_text: str, difficulty: str) -> Dict[str, Any]:
        """Fallback multiple choice generation"""
        # Extract key terms for distractors
        if self.nlp:
            doc = self.nlp(reference_text)
            terms = [token.text for token in doc if token.pos_ in ["NOUN", "PROPN", "ADJ"] and not token.is_stop]
        else:
            terms = re.findall(r'\b[A-Za-z]+\b', reference_text)
        
        correct_answer = reference_text[:50] + "..." if len(reference_text) > 50 else reference_text
        
        distractors = []
        for term in terms[:3]:
            distractors.append(f"Something related to {term}")
        
        while len(distractors) < 3:
            distractors.append(f"Incorrect option {len(distractors) + 1}")
        
        options = [correct_answer] + distractors[:3]
        random.shuffle(options)
        
        return {
            "question": question,
            "options": options,
            "correct_answer": correct_answer,
            "explanation": "Based on the reference text.",
            "type": "multiple_choice",
            "difficulty": difficulty
        }

    # Legacy methods for backward compatibility with existing frontend
    def _generate_ai_distractors(self, concept: str, context: str, difficulty: str) -> List[str]:
        """Legacy method - now uses the new dual-model approach internally"""
        question = f"What is true about '{concept}'?"
        result = self._handle_multiple_choice_with_model_b(question, context, difficulty)
        # Extract just the distractors (exclude correct answer)
        all_options = result.get("options", [])
        correct_answer = result.get("correct_answer", "")
        distractors = [opt for opt in all_options if opt != correct_answer]
        return distractors[:3]

    def _generate_multiple_choice_question(self, concept: str, context: str, difficulty: str) -> Dict[str, Any]:
        """Legacy method - updated to use dual-model approach"""
        question = f"What is true about '{concept}'?"
        return self._handle_multiple_choice_with_model_b(question, context, difficulty)

    def _generate_true_false_question(self, concept: str, context: str, difficulty: str) -> Dict[str, Any]:
        """Legacy method - updated to use dual-model approach"""
        context_sentence = self._find_context_sentence(context, concept)
        if not context_sentence:
            context_sentence = f"{concept} is a known topic."
        
        question = f"True or False: {context_sentence}"
        return self._handle_true_false_with_model_b(question, context_sentence, difficulty)

    def _generate_fill_blank_question(self, text: str, difficulty: str) -> Dict[str, Any]:
        """Legacy method - updated to use dual-model approach"""
        # Find a good sentence to create a fill-in-the-blank from
        sentences = re.split(r'(?<=[.!?])\s+', text)
        if not sentences:
            return None
        
        sentence = random.choice(sentences)
        question = f"Complete this statement: {sentence}"
        return self._handle_fill_blank_with_model_b(question, sentence, difficulty)

    def _estimate_difficulty(self, questions: List[Dict]) -> str:
        """Estimate overall quiz difficulty"""
        difficulty_scores = {"easy": 1, "medium": 2, "hard": 3}
        total_score = sum(difficulty_scores.get(q.get("difficulty", "medium"), 2) for q in questions)
        avg_score = total_score / len(questions) if questions else 2
        
        if avg_score < 1.5:
            return "easy"
        elif avg_score < 2.5:
            return "medium"
        else:
            return "hard"

    def _create_basic_questions(self, content: str, num_questions: int, difficulty: str, question_types: List[str]) -> List[Dict[str, Any]]:
        """Create very basic questions when all else fails"""
        sentences = re.split(r'(?<=[.!?])\s+', content)
        if not sentences or not sentences[0].strip():
            # If no proper sentences, create from paragraphs or words
            paragraphs = content.split('\n\n')
            sentences = [p.strip() for p in paragraphs if p.strip()]
            if not sentences:
                words = content.split()
                sentences = [' '.join(words[i:i+10]) for i in range(0, len(words), 10)][:num_questions]
        
        questions = []
        for i in range(min(num_questions, len(sentences))):
            question_type = random.choice(question_types)
            sentence = sentences[i]
            
            if question_type == "true_false":
                question = f"True or False: {sentence}"
            elif question_type == "fill_blank":
                words = sentence.split()
                if len(words) > 3:
                    blank_word = random.choice(words[1:-1])
                    question = sentence.replace(blank_word, "_____", 1)
                else:
                    question = f"Complete this: {sentence} _____"
            elif question_type == "short_answer":
                question = f"What is the main point of: {sentence[:80]}...?"
            else:  # multiple_choice
                question = f"What does this statement describe: '{sentence[:60]}...'?"
            
            questions.append({
                "question": question,
                "type": question_type,
                "reference_text": sentence,
                "difficulty": difficulty
            })
        
        return questions

    # Additional utility methods for frontend compatibility
    def get_model_status(self) -> Dict[str, Any]:
        """Get current status of AI models"""
        return {
            "ai_models_available": self.ai_models_available,
            "openai_available": self.openai_available,
            "fast_mode": self.fast_mode,
            "question_model": self.question_model,
            "option_model": self.option_model,
            "openai_model": self.openai_model if self.openai_available else None,
            "ollama_url": self.ollama_url,
            "model_performance": self.model_performance,
            "cache_size": len(self.model_cache),
            "use_openai_fallback": self.use_openai_fallback
        }

    def clear_cache(self):
        """Clear the model response cache"""
        self.model_cache.clear()
        print("🗑️ Model cache cleared")

    def set_fast_mode(self, enabled: bool):
        """Enable or disable fast mode"""
        self.fast_mode = enabled
        if enabled:
            print("🚀 Fast mode enabled")
        else:
            print("🌐 Fast mode disabled")

    def benchmark_models(self) -> Dict[str, float]:
        """Benchmark model response times"""
        if not self.ai_models_available:
            return {"error": "AI models not available"}
        
        test_prompt = "Generate a simple test question about science."
        
        # Benchmark question model
        start_time = time.time()
        self._call_ollama_api(self.question_model, test_prompt, max_tokens=50)
        question_model_time = time.time() - start_time
        
        # Benchmark option model (if different)
        if self.option_model != self.question_model:
            start_time = time.time()
            self._call_ollama_api(self.option_model, test_prompt, max_tokens=50)
            option_model_time = time.time() - start_time
        else:
            option_model_time = question_model_time
        
        return {
            "question_model_time": question_model_time,
            "option_model_time": option_model_time,
            "average_time": (question_model_time + option_model_time) / 2
        }
    def _try_gemini_question_generation(self, content: str, num_questions: int, difficulty: str, question_types: List[str]) -> List[Dict[str, Any]]:
        """Try generating questions with Gemini"""
        try:
            prompt = f"""Generate exactly {num_questions} quiz questions from the provided content.

    Content:
    {content[:2000]}

    Requirements:
    - Generate exactly {num_questions} questions
    - Difficulty level: {difficulty}
    - Question types to use: {', '.join(question_types)}
    - Each question should include a reference to the source text
    - Return as a valid JSON array

    Format:
    [
    {{
        "question": "Question text here",
        "type": "multiple_choice",
        "reference_text": "Relevant excerpt from content",
        "difficulty": "{difficulty}"
    }}
    ]

    Return ONLY the JSON array, no additional text.
    """

            response = self._call_gemini_api(prompt, max_tokens=1000, temperature=0.3)

            if response:
                json_start = response.find('[')
                json_end = response.rfind(']') + 1
                if json_start != -1 and json_end > json_start:
                    json_str = response[json_start:json_end]
                    questions = json.loads(json_str)
                    if isinstance(questions, list) and len(questions) > 0:
                        return questions[:num_questions]
            return []

        except Exception as e:
            print(f"⚠️ Gemini question generation error: {e}")
            return []
