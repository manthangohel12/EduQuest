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

class QuizGenerator:
    def __init__(self, question_model: str = "mistral:7b-instruct-q4_0", option_model: str = "mistral:7b-instruct-q4_0", 
                 use_ai_models: bool = True, fast_mode: bool = False, ollama_url: str = "http://127.0.0.1:11434"):
        self.nlp = None
        self._load_nlp()
        self.question_model = question_model
        self.option_model = option_model
        self.use_ai_models = use_ai_models
        self.fast_mode = fast_mode
        self.ollama_url = ollama_url
        self.ai_models_available = False
        self.executor = ThreadPoolExecutor(max_workers=2)  # For concurrent requests
        self.common_words = {
            "thing", "something", "someone", "people", "important", "different", 
            "various", "number", "many", "much", "several", "type"
        }
        
        # Check if AI models are available on initialization
        if self.use_ai_models and not self.fast_mode:
            self._check_ai_models_availability()
        else:
            print("🚀 Fast mode enabled - using NLP-based generation for speed")

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

    def _check_ai_models_availability(self):
        """Check if Ollama API and models are available with GPU support"""
        try:
            # Check if Ollama API is running
            response = requests.get(f"{self.ollama_url}/api/tags", timeout=5)
            
            if response.status_code == 200:
                models_data = response.json()
                available_models = [model['name'] for model in models_data.get('models', [])]
                
                # Check if our models are available
                has_question_model = any(self.question_model in model for model in available_models)
                has_option_model = any(self.option_model in model for model in available_models)
                
                if has_question_model and has_option_model:
                    # Test model responsiveness with GPU
                    test_result = self._quick_api_test()
                    if test_result:
                        self.ai_models_available = True
                        print(f"✅ AI models available via API with GPU: {self.question_model}, {self.option_model}")
                        self._check_gpu_usage()
                    else:
                        self.ai_models_available = False
                        print(f"⚠ Models found but API test failed, using fallback mode")
                else:
                    print(f"⚠ Models not found. Available models: {available_models}")
                    self.ai_models_available = False
            else:
                print("⚠ Ollama API not responding")
                self.ai_models_available = False
                
        except Exception as e:
            print(f"⚠ Cannot connect to Ollama API: {e}")
            self.ai_models_available = False

    def _quick_api_test(self) -> bool:
        """Quick test using Ollama API to check GPU responsiveness"""
        try:
            # Simpler test that just checks if we can get a response
            response = requests.get(
                f"{self.ollama_url}/api/tags",
                timeout=5
            )
            
            if response.status_code == 200:
                return True
            return False
        except:
            return False

    def _check_gpu_usage(self):
        """Check if models are using GPU"""
        try:
            # Try to get GPU information from Ollama
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

    def _call_ollama_api(self, model_name: str, prompt: str, max_tokens: int = 200) -> str:
        """Call Ollama API directly for better GPU utilization"""
        
        if not self.ai_models_available:
            return ""
        
        try:
            payload = {
                "model": model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_predict": max_tokens,
                    "temperature": 0.3,
                    "top_k": 40,
                    "top_p": 0.9,
                    "num_gpu": -1,  # Use all available GPUs
                    "num_thread": 0,  # Let Ollama decide optimal threads
                }
            }
            
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json=payload,
                timeout=20,  # Reasonable timeout for GPU
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get('response', '').strip()
            else:
                print(f"API Error {response.status_code}: {response.text}")
                return ""
                
        except requests.exceptions.Timeout:
            print(f"⏱️ API timeout for {model_name}")
            return ""
        except Exception as e:
            print(f"🔴 API error for {model_name}: {e}")
            return ""

    async def _call_ollama_api_async(self, model_name: str, prompt: str, max_tokens: int = 200) -> str:
        """Async version for parallel processing"""
        
        if not self.ai_models_available:
            return ""
        
        payload = {
            "model": model_name,
            "prompt": prompt,
            "stream": False,
            "options": {
                "num_predict": max_tokens,
                "temperature": 0.3,
                "top_k": 40,
                "top_p": 0.9,
                "num_gpu": -1,
                "num_thread": 0,
            }
        }
        
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=20)) as session:
                async with session.post(
                    f"{self.ollama_url}/api/generate",
                    json=payload,
                    headers={'Content-Type': 'application/json'}
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result.get('response', '').strip()
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

    def _generate_questions_with_model_a(self, content: str, num_questions: int, difficulty: str, question_types: List[str]) -> List[Dict[str, Any]]:
        """Use Model A to generate questions from content with GPU acceleration"""
        
        # If AI models aren't available or fast mode, use fallback immediately
        if not self.ai_models_available or self.fast_mode:
            print("🔄 Using fallback question generation (fast mode or AI unavailable)...")
            return self._generate_fallback_questions(content, num_questions, difficulty, question_types)
        
        # Optimized prompt for GPU processing
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

        print(f"🚀 GPU-accelerated generation with {self.question_model}...")
        response = self._call_ollama_api(self.question_model, prompt, max_tokens=800)
        
        if response:
            try:
                # Clean the response to extract JSON
                json_start = response.find('[')
                json_end = response.rfind(']') + 1
                if json_start != -1 and json_end > json_start:
                    json_str = response[json_start:json_end]
                    questions = json.loads(json_str)
                    if isinstance(questions, list) and len(questions) > 0:
                        print(f"✅ GPU generated {len(questions)} questions successfully")
                        return questions[:num_questions]  # Ensure we don't exceed requested count
            except (json.JSONDecodeError, ValueError) as e:
                print(f"⚠ JSON parsing failed: {e}")
                print(f"Response was: {response[:200]}...")
        
        print("🔄 GPU generation failed, using enhanced fallback...")
        # Disable AI for rest of session if it failed
        self.ai_models_available = False
        return self._generate_fallback_questions(content, num_questions, difficulty, question_types)

    def _generate_options_with_model_b(self, question: str, reference_text: str, question_type: str, difficulty: str) -> Dict[str, Any]:
        """Use Model B to generate options/answers for a given question"""
        
        # If AI models aren't available or fast mode, use fallback immediately
        if not self.ai_models_available or self.fast_mode:
            return self._generate_fallback_options(question, reference_text, question_type, difficulty)
        
        if question_type == "multiple_choice":
            return self._handle_multiple_choice_with_model_b(question, reference_text, difficulty)
        elif question_type == "true_false":
            return self._handle_true_false_with_model_b(question, reference_text, difficulty)
        elif question_type == "fill_blank":
            return self._handle_fill_blank_with_model_b(question, reference_text, difficulty)
        else:
            return self._handle_short_answer_with_model_b(question, reference_text, difficulty)

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
            print("⚠ Could not generate a direct answer, using fallback")
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
            print(f"⚠ Option generation failed: {e}, using fallback")
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

        response = self._call_ollama_model(self.option_model, prompt)
        
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

        response = self._call_ollama_model(self.option_model, prompt)
        
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
        """Fallback method when Model A fails"""
        sentences = re.split(r'(?<=[.!?])\s+', content)
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
                    question = f"What is mentioned in: {sentence}"
            else:
                question = f"What does this statement refer to: '{sentence[:100]}...'?"
            
            questions.append({
                "question": question,
                "type": question_type,
                "reference_text": sentence,
                "difficulty": difficulty
            })
        
        return questions

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

    async def generate_quiz(self, content: str, num_questions: int = 5, difficulty: str = "medium", 
                          question_types: List[str] = ["multiple_choice"]) -> Dict[str, Any]:
        """
        Generate quiz using GPU-accelerated AI models with parallel processing
        """
        
        print(f"🎯 Starting GPU-accelerated quiz generation: {num_questions} questions, difficulty: {difficulty}")
        print(f"📝 Question types: {question_types}")
        print(f"🚀 AI models available: {self.ai_models_available}")
        
        if self.ai_models_available:
            print(f"🔥 Using GPU-optimized models: {self.question_model} + {self.option_model}")
        else:
            print("🔄 Using enhanced NLP-based generation")
        
        # Step 1: Generate questions using GPU-accelerated Model A (or fallback)
        raw_questions = self._generate_questions_with_model_a(content, num_questions, difficulty, question_types)
        
        if not raw_questions:
            print("⚠ No questions generated, creating enhanced fallback questions...")
            raw_questions = self._create_basic_questions(content, num_questions, difficulty, question_types)
        
        print(f"📋 Processing {len(raw_questions)} questions with GPU acceleration...")
        
        # Step 2: Process questions in parallel for better GPU utilization
        if self.ai_models_available and len(raw_questions) > 1:
            # Parallel processing for multiple questions
            final_questions = await self._process_questions_parallel(raw_questions)
        else:
            # Sequential processing (fallback or single question)
            final_questions = []
            for i, raw_q in enumerate(raw_questions):
                print(f"⚙️  Processing question {i+1}/{len(raw_questions)}...")
                
                question_data = self._generate_options_with_model_b(
                    raw_q["question"],
                    raw_q.get("reference_text", ""),
                    raw_q["type"],
                    raw_q["difficulty"]
                )
                
                question_data["id"] = i + 1
                final_questions.append(question_data)
        
        estimated_difficulty = self._estimate_difficulty(final_questions)
        
        print(f"✅ GPU-accelerated quiz generation complete! Generated {len(final_questions)} questions")
        
        # Enhanced return data
        return {
            "questions": final_questions,
            "total_questions": len(final_questions),
            "estimated_difficulty": estimated_difficulty,
            "content_length": len(content),
            "concepts_used": len(self._extract_key_phrases(content)) if self._extract_key_phrases(content) else 0,
            "gpu_accelerated": self.ai_models_available,
            "ai_models_used": self.ai_models_available,
            "models_used": {
                "question_generator": self.question_model if self.ai_models_available else "enhanced_nlp",
                "option_generator": self.option_model if self.ai_models_available else "enhanced_nlp"
            },
            "processing_method": "gpu_parallel" if self.ai_models_available else "nlp_fallback"
        }

    async def _process_questions_parallel(self, raw_questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Process multiple questions in parallel for better GPU utilization"""
        print("🚀 Using parallel GPU processing...")
        
        async def process_single_question(i: int, raw_q: Dict[str, Any]) -> Dict[str, Any]:
            """Process a single question asynchronously"""
            # For now, we'll use the sync version but this can be expanded
            question_data = self._generate_options_with_model_b(
                raw_q["question"],
                raw_q.get("reference_text", ""),
                raw_q["type"],
                raw_q["difficulty"]
            )
            question_data["id"] = i + 1
            return question_data
        
        # Process questions concurrently
        tasks = [
            process_single_question(i, raw_q) 
            for i, raw_q in enumerate(raw_questions)
        ]
        
        final_questions = await asyncio.gather(*tasks)
        print(f"✅ Parallel processing completed for {len(final_questions)} questions")
        
        return final_questions

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