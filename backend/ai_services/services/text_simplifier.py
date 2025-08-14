import asyncio
import re
import logging
from typing import List, Dict, Any, Optional
import textstat
import ollama
from .file_processor import FileProcessor
import os
import time


class TextSimplifier:
    def __init__(self):
        # Use quantized model for faster inference
        self.model_name = "mistral:7b-instruct-q4_0"  # Quantized version is 3-4x faster
        self.file_processor = FileProcessor()
        self.fast_mode = os.getenv("AI_FAST_MODE", "false").lower() == "true"
        
        # Pre-warm the model by loading it into memory
        self._preload_model()
        print(f"Using optimized Ollama model: {self.model_name}")

    def _preload_model(self):
        """Pre-load the model to avoid cold start delays."""
        try:
            ollama.generate(
                model=self.model_name,
                prompt="Hello",
                options={"max_tokens": 1}
            )
            print("✓ Model preloaded successfully")
        except Exception as e:
            print(f"⚠ Model preload warning: {e}")

    async def _run_ollama_optimized(self, prompt: str, max_tokens: int = 500) -> Optional[str]:
        """
        Optimized Ollama request with performance tuning.
        """
        try:
            def run_chat():
                return ollama.generate(
                    model=self.model_name,
                    prompt=prompt,
                    options={
                        # Performance optimizations
                        "num_predict": max_tokens,  # Limit output length
                        "temperature": 0.3,         # Lower temperature for more focused output
                        "top_k": 10,               # Reduce sampling space
                        "top_p": 0.8,              # Focus on most likely tokens
                        "repeat_penalty": 1.1,     # Avoid repetition
                        "num_ctx": 2048,           # Smaller context window
                        "num_batch": 8,            # Batch size for faster processing
                        "num_thread": 4,           # Use multiple threads
                        "use_mmap": True,          # Memory mapping for efficiency
                        "use_mlock": True,         # Lock memory for consistent performance
                        # Stop tokens to prevent over-generation
                        "stop": ["\n\n", "---", "END", "</summary>", "User:", "Human:"]
                    }
                )

            response = await asyncio.to_thread(run_chat)
            
            if response and "response" in response:
                return response["response"].strip()
            else:
                logging.error(f"Ollama returned unexpected response: {response}")
                return None

        except Exception as e:
            logging.exception(f"Ollama optimized run failed: {e}")
            return None

    def _create_optimized_prompt(self, text: str, task_type: str, difficulty_level: str, max_words: int = 200) -> str:
        """
        Create concise, effective prompts that generate faster responses.
        """
        prompts = {
            "summarize": f"""Summarize this text in exactly {max_words} words or less. Be concise and focus on key points only.

Text: {text}

Summary:""",

            "simplify": f"""Rewrite this text for {difficulty_level} level. Make it clear and simple. Use short sentences.

Original: {text}

Simplified:""",

            "explain": f"""Explain this concept simply in 2-3 sentences:

Concept: {text}

Explanation:"""
        }
        
        return prompts.get(task_type, prompts["simplify"])

    async def _summarize_with_mistral_optimized(self, text: str, max_length: int = 200) -> str:
        """
        Optimized summarization with faster generation.
        """
        prompt = self._create_optimized_prompt(text, "summarize", "intermediate", max_length)
        
        # Use shorter max_tokens for summaries
        resp = await self._run_ollama_optimized(prompt, max_tokens=max_length + 50)
        
        if resp:
            # Clean and validate response
            summary = self._clean_response(resp)
            return summary[:max_length * 10]  # Ensure reasonable length
        else:
            return self._rule_based_summarization(text)

    async def _simplify_with_mistral_optimized(self, text: str, difficulty_level: str, target_audience: str) -> str:
        """
        Optimized simplification with focused prompts.
        """
        prompt = self._create_optimized_prompt(text, "simplify", difficulty_level)
        
        resp = await self._run_ollama_optimized(prompt, max_tokens=len(text.split()) + 100)
        
        if resp:
            simplified = self._clean_response(resp)
            return simplified
        else:
            return self._rule_based_simplification(text)

    def _clean_response(self, response: str) -> str:
        """
        Clean and optimize model responses.
        """
        # Remove common prefixes/suffixes
        response = re.sub(r'^(Summary:|Simplified:|Explanation:)\s*', '', response, flags=re.IGNORECASE)
        response = re.sub(r'\n\s*\n', '\n', response)  # Remove extra newlines
        response = response.strip()
        
        # Remove incomplete sentences at the end
        sentences = response.split('.')
        if len(sentences) > 1 and len(sentences[-1].strip()) < 10:
            response = '.'.join(sentences[:-1]) + '.'
        
        return response

    def _analyze_complexity(self, text: str) -> Dict[str, Any]:
        return {
            "flesch_reading_ease": textstat.flesch_reading_ease(text),
            "flesch_kincaid_grade": textstat.flesch_kincaid_grade(text),
            "gunning_fog": textstat.gunning_fog(text),
            "smog_index": textstat.smog_index(text),
            "automated_readability_index": textstat.automated_readability_index(text),
            "coleman_liau_index": textstat.coleman_liau_index(text),
            "linsear_write_formula": textstat.linsear_write_formula(text),
            "dale_chall_readability_score": textstat.dale_chall_readability_score(text),
            "difficult_words": textstat.difficult_words(text),
            "syllable_count": textstat.syllable_count(text),
            "lexicon_count": textstat.lexicon_count(text),
            "sentence_count": textstat.sentence_count(text)
        }

    async def _extract_key_concepts(self, text: str) -> List[str]:
        """Extract key concepts from text using optimized approach."""
        if not text:
            return []
            
        # First try with the optimized model if not in fast mode
        if not self.fast_mode:
            concepts = await self._generate_key_concepts_optimized(text)
            if concepts:
                return concepts
                
        # Fallback to rule-based extraction
        words = re.findall(r'\b\w+\b', text.lower())
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
            'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
        }
        keywords = [word for word in words if word not in stop_words and len(word) > 3]
        from collections import Counter
        concept_counts = Counter(keywords)
        return [concept for concept, count in concept_counts.most_common(5)]

    async def _generate_key_concepts_optimized(self, text: str) -> List[str]:
        """
        Fast key concept extraction using optimized prompts.
        """
        prompt = f"""List 5 key concepts from this text as single words or short phrases:

{text}

Concepts:"""
        
        resp = await self._run_ollama_optimized(prompt, max_tokens=50)
        
        if resp:
            # Parse concepts from response
            concepts = []
            lines = resp.strip().split('\n')
            for line in lines[:5]:  # Take only first 5
                clean_line = re.sub(r'^[\d\-\*\•\.]\s*', '', line.strip())
                if clean_line and len(clean_line) > 2:
                    concepts.append(clean_line[:30])  # Limit length
            return concepts[:5]
        return []

    async def _generate_explanations_with_mistral(self, concepts: List[str], difficulty_level: str, text_context: str) -> List[str]:
        """Generate explanations for key concepts using optimized batch processing."""
        if not concepts or not text_context:
            return []
            
        if self.fast_mode:
            # In fast mode, use a simpler approach
            return [f"{concept} is an important concept in this context." for concept in concepts[:3]]
            
        # Use optimized batch processing for explanations
        return await self._generate_explanations_batch_optimized(concepts, text_context)
        
    async def _generate_explanations_batch_optimized(self, concepts: List[str], text_context: str) -> List[str]:
        """
        Generate explanations in batch for efficiency.
        """
        if not concepts:
            return []
        
        # Create single prompt for all concepts (more efficient than individual requests)
        concepts_text = ", ".join(concepts[:3])  # Limit to 3 for speed
        
        prompt = f"""Explain these concepts briefly (1 sentence each):

Context: {text_context}
Concepts: {concepts_text}

Explanations:"""
        
        resp = await self._run_ollama_optimized(prompt, max_tokens=150)
        
        if resp:
            # Parse explanations
            explanations = []
            sentences = resp.split('.')
            for sentence in sentences[:3]:
                clean_sentence = sentence.strip()
                if clean_sentence and len(clean_sentence) > 10:
                    explanations.append(clean_sentence + '.')
            return explanations
        else:
            return [f"{concept} is an important concept in this context." for concept in concepts[:3]]

    async def _simplify_with_mistral(self, text: str, difficulty_level: str, target_audience: str) -> str:
        """Legacy method for backward compatibility."""
        return await self._simplify_with_mistral_optimized(text, difficulty_level, target_audience)

    async def _summarize_with_mistral(self, text: str, max_length: int = 500) -> str:
        """Legacy method for backward compatibility."""
        return await self._summarize_with_mistral_optimized(text, max_length)

    def _rule_based_simplification(self, text: str) -> str:
        simplified = text
        word_replacements = {
            "utilize": "use",
            "implement": "use",
            "facilitate": "help",
            "subsequently": "then",
            "consequently": "so",
            "nevertheless": "but",
            "furthermore": "also",
            "moreover": "also",
            "approximately": "about",
            "demonstrate": "show",
            "indicate": "show",
            "establish": "set up",
            "maintain": "keep",
            "obtain": "get",
            "acquire": "get",
            "comprehend": "understand",
            "elucidate": "explain",
            "clarify": "explain"
        }
        for complex_word, simple_word in word_replacements.items():
            simplified = re.sub(rf'\b{complex_word}\b', simple_word, simplified, flags=re.IGNORECASE)
        sentences = re.split(r'[.!?]+', simplified)
        simplified_sentences = []
        for sentence in sentences:
            if len(sentence.split()) > 20:
                parts = re.split(r'\s+(and|or|but)\s+', sentence)
                if len(parts) > 1:
                    simplified_sentences.extend(parts)
                else:
                    simplified_sentences.append(sentence)
            else:
                simplified_sentences.append(sentence)
        return '. '.join(simplified_sentences) + '.'

    def _rule_based_summarization(self, text: str) -> str:
        sentences = re.split(r'[.!?]+', text)
        summary_sentences = sentences[:3]
        return '. '.join(summary_sentences) + '.'

    async def process_file(self, file_content: bytes, filename: str, difficulty_level: str = "intermediate", target_audience: str = "student") -> Dict[str, Any]:
        try:
            file_result = self.file_processor.process_file(filename, file_content)
            extracted_text = file_result['text']
            metadata = file_result['metadata']
            result = await self.simplify(extracted_text, difficulty_level, target_audience)
            result['file_metadata'] = metadata
            result['filename'] = filename
            return result
        except Exception as e:
            logging.error(f"Error processing file {filename}: {e}")
            raise

    async def simplify(self, text: str, difficulty_level: str = "intermediate", target_audience: str = "student") -> Dict[str, Any]:
        """
        Optimized main simplification method with parallel processing.
        """
        start_time = time.time()
        
        # Quick complexity analysis
        original_complexity = self._analyze_complexity(text)
        
        # Run optimized tasks in parallel with limited concurrency
        tasks = []
        
        # Core tasks
        simplify_task = asyncio.create_task(
            self._simplify_with_mistral_optimized(text, difficulty_level, target_audience)
        )
        tasks.append(simplify_task)
        
        # Optional tasks (run only if not in fast mode)
        if not self.fast_mode:
            summarize_task = asyncio.create_task(
                self._summarize_with_mistral_optimized(text, max_length=150)
            )
            concepts_task = asyncio.create_task(
                self._extract_key_concepts(text)
            )
            tasks.extend([summarize_task, concepts_task])
        
        # Execute with proper error handling
        try:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            simplified_text = results[0] if not isinstance(results[0], Exception) else self._rule_based_simplification(text)
            summary = results[1] if len(results) > 1 and not isinstance(results[1], Exception) else simplified_text[:200] + "..."
            key_concepts = results[2] if len(results) > 2 and not isinstance(results[2], Exception) else await self._extract_key_concepts(text)
            
        except Exception as e:
            logging.error(f"Parallel processing failed: {e}")
            # Fallback to sequential processing
            simplified_text = await self._simplify_with_mistral_optimized(text, difficulty_level, target_audience)
            summary = simplified_text[:200] + "..."
            key_concepts = await self._extract_key_concepts(text)
        
        # Generate explanations only if we have concepts
        explanations = []
        if key_concepts and not self.fast_mode:
            explanations = await self._generate_explanations_batch_optimized(key_concepts, text)
        
        simplified_complexity = self._analyze_complexity(simplified_text)
        processing_time = time.time() - start_time
        
        return {
            "simplified_text": simplified_text,
            "summary": summary,
            "original_complexity": original_complexity["flesch_reading_ease"],
            "simplified_complexity": simplified_complexity["flesch_reading_ease"],
            "key_concepts": key_concepts,
            "explanations": explanations,
            "original_text": text,
            "difficulty_level": difficulty_level,
            "target_audience": target_audience,
            "processing_time": processing_time,
            "complexity_metrics": {
                "original": original_complexity,
                "simplified": simplified_complexity
            }
        }

    def get_supported_file_formats(self) -> List[str]:
        return self.file_processor.get_supported_formats()
