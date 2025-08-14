import re
import random
from typing import List, Dict, Any
import spacy
from collections import Counter

class QuizGenerator:
    def __init__(self):
        self.nlp = None
        self._load_nlp()
    
    def _load_nlp(self):
        """Load spaCy model for NLP processing"""
        try:
            self.nlp = spacy.load("en_core_web_sm")
            print("spaCy model loaded successfully")
        except OSError:
            print("spaCy model not found. Installing...")
            import subprocess
            subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
            self.nlp = spacy.load("en_core_web_sm")
        except Exception as e:
            print(f"Error loading spaCy: {e}")
            self.nlp = None
    
    def _extract_entities(self, text: str) -> List[str]:
        """Extract named entities from text"""
        if not self.nlp:
            return []
        
        doc = self.nlp(text)
        entities = []
        for ent in doc.ents:
            entities.append(ent.text)
        return entities
    
    def _extract_key_phrases(self, text: str) -> List[str]:
        """Extract key phrases and concepts"""
        if not self.nlp:
            # Fallback to simple keyword extraction
            words = re.findall(r'\b\w+\b', text.lower())
            stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being'}
            keywords = [word for word in words if word not in stop_words and len(word) > 3]
            return list(set(keywords))[:10]
        
        doc = self.nlp(text)
        key_phrases = []
        
        # Extract noun phrases
        for chunk in doc.noun_chunks:
            if len(chunk.text.split()) <= 4:  # Limit phrase length
                key_phrases.append(chunk.text)
        
        # Extract important words (nouns, verbs, adjectives)
        important_words = []
        for token in doc:
            if token.pos_ in ['NOUN', 'VERB', 'ADJ'] and not token.is_stop:
                important_words.append(token.text)
        
        return list(set(key_phrases + important_words))[:15]
    
    def _generate_multiple_choice_question(self, concept: str, context: str, difficulty: str) -> Dict[str, Any]:
        """Generate a multiple choice question for a concept"""
        # Question templates based on difficulty
        templates = {
            "easy": [
                f"What is {concept}?",
                f"Which of the following describes {concept}?",
                f"What does {concept} mean?"
            ],
            "medium": [
                f"How does {concept} work?",
                f"What is the purpose of {concept}?",
                f"Which statement about {concept} is correct?"
            ],
            "hard": [
                f"What are the implications of {concept}?",
                f"How does {concept} relate to other concepts?",
                f"What would happen if {concept} were different?"
            ]
        }
        
        question_template = random.choice(templates.get(difficulty, templates["medium"]))
        
        # Generate distractors (wrong answers)
        distractors = self._generate_distractors(concept, difficulty)
        
        # Generate correct answer
        correct_answer = self._generate_correct_answer(concept, context)
        
        # Shuffle options
        options = [correct_answer] + distractors
        random.shuffle(options)
        
        return {
            "question": question_template,
            "options": options,
            "correct_answer": correct_answer,
            "explanation": f"{concept} is a key concept in this topic.",
            "difficulty": difficulty
        }
    
    def _generate_distractors(self, concept: str, difficulty: str) -> List[str]:
        """Generate wrong answer options"""
        # Simple distractor generation (can be enhanced with AI)
        distractors = []
        
        if difficulty == "easy":
            distractors = [
                f"Something related to {concept}",
                f"A different type of {concept}",
                f"Not {concept}"
            ]
        elif difficulty == "medium":
            distractors = [
                f"A similar but different concept to {concept}",
                f"The opposite of {concept}",
                f"A broader category that includes {concept}"
            ]
        else:  # hard
            distractors = [
                f"A concept that contradicts {concept}",
                f"A more advanced version of {concept}",
                f"A foundational concept that {concept} builds upon"
            ]
        
        return distractors[:3]  # Return 3 distractors
    
    def _generate_correct_answer(self, concept: str, context: str) -> str:
        """Generate a correct answer for the concept"""
        # Simple answer generation (can be enhanced with AI)
        return f"The correct answer about {concept}"
    
    def _generate_true_false_question(self, concept: str, context: str, difficulty: str) -> Dict[str, Any]:
        """Generate a true/false question"""
        statements = [
            f"{concept} is an important concept.",
            f"{concept} is always true.",
            f"{concept} can be applied in many situations.",
            f"{concept} is a basic principle."
        ]
        
        question = random.choice(statements)
        correct_answer = random.choice([True, False])
        
        return {
            "question": question,
            "options": [True, False],
            "correct_answer": correct_answer,
            "explanation": f"This statement about {concept} is {'correct' if correct_answer else 'incorrect'}.",
            "difficulty": difficulty
        }
    
    def _generate_fill_blank_question(self, text: str, difficulty: str) -> Dict[str, Any]:
        """Generate a fill-in-the-blank question"""
        # Find potential blanks in text
        sentences = re.split(r'[.!?]+', text)
        suitable_sentences = [s for s in sentences if len(s.split()) > 5]
        
        if not suitable_sentences:
            return None
        
        sentence = random.choice(suitable_sentences)
        words = sentence.split()
        
        # Choose a word to blank out
        if len(words) > 3:
            blank_index = random.randint(1, len(words) - 2)  # Avoid first and last words
            blank_word = words[blank_index]
            words[blank_index] = "_____"
            
            question = " ".join(words)
            
            return {
                "question": question,
                "correct_answer": blank_word,
                "explanation": f"The missing word is '{blank_word}'.",
                "difficulty": difficulty
            }
        
        return None
    
    def _estimate_difficulty(self, questions: List[Dict]) -> str:
        """Estimate the overall difficulty of the quiz"""
        difficulty_scores = {"easy": 1, "medium": 2, "hard": 3}
        total_score = sum(difficulty_scores.get(q.get("difficulty", "medium"), 2) for q in questions)
        avg_score = total_score / len(questions)
        
        if avg_score < 1.5:
            return "easy"
        elif avg_score < 2.5:
            return "medium"
        else:
            return "hard"
    
    async def generate_quiz(self, content: str, num_questions: int = 5, difficulty: str = "medium", question_types: List[str] = ["multiple_choice"]) -> Dict[str, Any]:
        """Generate quiz questions from content"""
        # Extract key concepts
        key_concepts = self._extract_key_phrases(content)
        entities = self._extract_entities(content)
        
        # Combine concepts and entities
        all_concepts = list(set(key_concepts + entities))[:num_questions * 2]
        
        if not all_concepts:
            # Fallback to simple word extraction
            words = re.findall(r'\b\w+\b', content.lower())
            stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
            all_concepts = [word for word in words if word not in stop_words and len(word) > 3][:num_questions * 2]
        
        questions = []
        
        for i in range(num_questions):
            if i < len(all_concepts):
                concept = all_concepts[i]
                
                # Choose question type
                question_type = random.choice(question_types) if question_types else "multiple_choice"
                
                if question_type == "multiple_choice":
                    question = self._generate_multiple_choice_question(concept, content, difficulty)
                elif question_type == "true_false":
                    question = self._generate_true_false_question(concept, content, difficulty)
                elif question_type == "fill_blank":
                    question = self._generate_fill_blank_question(content, difficulty)
                else:
                    question = self._generate_multiple_choice_question(concept, content, difficulty)
                
                if question:
                    question["id"] = i + 1
                    question["type"] = question_type
                    questions.append(question)
        
        # Ensure we have enough questions
        while len(questions) < num_questions and len(all_concepts) > len(questions):
            concept = all_concepts[len(questions)]
            question = self._generate_multiple_choice_question(concept, content, difficulty)
            question["id"] = len(questions) + 1
            question["type"] = "multiple_choice"
            questions.append(question)
        
        estimated_difficulty = self._estimate_difficulty(questions)
        
        return {
            "questions": questions,
            "total_questions": len(questions),
            "estimated_difficulty": estimated_difficulty,
            "content_length": len(content),
            "concepts_used": len(all_concepts)
        } 