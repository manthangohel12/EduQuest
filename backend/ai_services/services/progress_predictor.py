import numpy as np
import pandas as pd
from typing import List, Dict, Any
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import joblib
import os

class ProgressPredictor:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.model_path = "models/progress_predictor.joblib"
        self.scaler_path = "models/progress_scaler.joblib"
        self._load_or_create_model()
    
    def _load_or_create_model(self):
        """Load existing model or create a new one"""
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
                self.model = joblib.load(self.model_path)
                self.scaler = joblib.load(self.scaler_path)
                print("Progress prediction model loaded successfully")
            else:
                self._create_model()
        except Exception as e:
            print(f"Error loading model: {e}")
            self._create_model()
    
    def _create_model(self):
        """Create a new progress prediction model"""
        # Create synthetic training data
        np.random.seed(42)
        n_samples = 1000
        
        # Generate synthetic learning data
        study_time = np.random.normal(20, 10, n_samples)  # hours per week
        completed_lessons = np.random.poisson(15, n_samples)  # lessons completed
        current_score = np.random.normal(75, 15, n_samples)  # current performance
        practice_sessions = np.random.poisson(8, n_samples)  # practice sessions
        quiz_attempts = np.random.poisson(12, n_samples)  # quiz attempts
        time_spent_per_lesson = np.random.normal(45, 15, n_samples)  # minutes
        
        # Create target variable (predicted score)
        predicted_score = (
            0.3 * current_score +
            0.2 * (study_time / 10) +
            0.15 * (completed_lessons / 5) +
            0.15 * (practice_sessions / 2) +
            0.1 * (quiz_attempts / 3) +
            0.1 * (time_spent_per_lesson / 30) +
            np.random.normal(0, 5, n_samples)
        )
        
        # Ensure scores are within reasonable bounds
        predicted_score = np.clip(predicted_score, 0, 100)
        
        # Create feature matrix
        X = np.column_stack([
            study_time,
            completed_lessons,
            current_score,
            practice_sessions,
            quiz_attempts,
            time_spent_per_lesson
        ])
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, predicted_score, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.model.fit(X_train_scaled, y_train)
        
        # Save model
        os.makedirs("models", exist_ok=True)
        joblib.dump(self.model, self.model_path)
        joblib.dump(self.scaler, self.scaler_path)
        
        print("New progress prediction model created and saved")
    
    def _extract_features(self, user_data: Dict[str, Any]) -> np.ndarray:
        """Extract features from user data"""
        features = [
            user_data.get("study_time", 0),
            user_data.get("completed_lessons", 0),
            user_data.get("current_score", 0),
            user_data.get("practice_sessions", 0),
            user_data.get("quiz_attempts", 0),
            user_data.get("time_spent_per_lesson", 45)
        ]
        return np.array(features).reshape(1, -1)
    
    def _generate_recommendations(self, current_score: float, predicted_score: float, subject: str) -> List[str]:
        """Generate study recommendations based on prediction"""
        recommendations = []
        
        if predicted_score < current_score:
            recommendations.extend([
                "Focus on reviewing fundamental concepts",
                "Increase practice time on difficult topics",
                "Take more practice quizzes to identify weak areas",
                "Consider seeking help from study groups or tutors"
            ])
        elif predicted_score > current_score + 10:
            recommendations.extend([
                "Maintain your current study habits",
                "Challenge yourself with advanced topics",
                "Help others learn to reinforce your knowledge",
                "Consider teaching concepts to solidify understanding"
            ])
        else:
            recommendations.extend([
                "Continue with your current study plan",
                "Focus on consistent practice",
                "Review material regularly to maintain retention",
                "Set specific goals for improvement"
            ])
        
        # Add subject-specific recommendations
        subject_recommendations = {
            "programming": [
                "Practice coding exercises daily",
                "Work on personal projects",
                "Read and understand other people's code",
                "Participate in coding challenges"
            ],
            "mathematics": [
                "Practice problem-solving regularly",
                "Focus on understanding concepts, not just memorizing",
                "Use visual aids and diagrams",
                "Apply math to real-world problems"
            ],
            "science": [
                "Conduct experiments and observations",
                "Read scientific articles and papers",
                "Connect concepts across different topics",
                "Use models and simulations"
            ],
            "language": [
                "Practice speaking and writing regularly",
                "Immerse yourself in the language",
                "Use language learning apps",
                "Watch movies and read books in the target language"
            ]
        }
        
        for subject_type, recs in subject_recommendations.items():
            if subject_type in subject.lower():
                recommendations.extend(recs[:2])  # Add 2 subject-specific recommendations
                break
        
        return recommendations[:6]  # Return top 6 recommendations
    
    def _get_recommended_topics(self, subject: str, current_score: float) -> List[str]:
        """Get recommended topics based on subject and current performance"""
        topic_recommendations = {
            "programming": {
                "beginner": ["Variables and Data Types", "Control Structures", "Functions", "Basic Algorithms"],
                "intermediate": ["Object-Oriented Programming", "Data Structures", "Error Handling", "Testing"],
                "advanced": ["Design Patterns", "Advanced Algorithms", "System Architecture", "Performance Optimization"]
            },
            "mathematics": {
                "beginner": ["Basic Arithmetic", "Algebra Fundamentals", "Geometry Basics", "Statistics Introduction"],
                "intermediate": ["Calculus", "Linear Algebra", "Probability", "Mathematical Proofs"],
                "advanced": ["Advanced Calculus", "Abstract Algebra", "Mathematical Analysis", "Number Theory"]
            },
            "science": {
                "beginner": ["Scientific Method", "Basic Chemistry", "Cell Biology", "Physics Fundamentals"],
                "intermediate": ["Organic Chemistry", "Genetics", "Mechanics", "Ecology"],
                "advanced": ["Quantum Physics", "Biochemistry", "Advanced Genetics", "Astrophysics"]
            }
        }
        
        # Determine level based on current score
        if current_score < 60:
            level = "beginner"
        elif current_score < 80:
            level = "intermediate"
        else:
            level = "advanced"
        
        # Get topics for the subject and level
        for subject_type, levels in topic_recommendations.items():
            if subject_type in subject.lower():
                return levels.get(level, ["General Topics", "Core Concepts", "Advanced Topics"])
        
        # Default topics
        return ["Core Concepts", "Fundamental Principles", "Advanced Topics", "Practical Applications"]
    
    def _calculate_confidence(self, user_data: Dict[str, Any]) -> float:
        """Calculate confidence in the prediction"""
        # Simple confidence calculation based on data quality
        confidence = 0.7  # Base confidence
        
        # Increase confidence with more data
        if user_data.get("completed_lessons", 0) > 10:
            confidence += 0.1
        if user_data.get("study_time", 0) > 15:
            confidence += 0.1
        if user_data.get("quiz_attempts", 0) > 5:
            confidence += 0.1
        
        # Decrease confidence for extreme values
        if user_data.get("current_score", 0) < 30 or user_data.get("current_score", 0) > 95:
            confidence -= 0.1
        
        return min(confidence, 0.95)  # Cap at 95%
    
    async def predict_progress(self, user_id: str, subject: str, current_score: float, study_time: float, completed_lessons: int) -> Dict[str, Any]:
        """Predict learning progress and provide recommendations"""
        # Prepare user data
        user_data = {
            "study_time": study_time,
            "completed_lessons": completed_lessons,
            "current_score": current_score,
            "practice_sessions": completed_lessons * 0.8,  # Estimate
            "quiz_attempts": completed_lessons * 1.2,  # Estimate
            "time_spent_per_lesson": 45  # Default 45 minutes per lesson
        }
        
        # Extract features
        features = self._extract_features(user_data)
        
        # Scale features
        features_scaled = self.scaler.transform(features)
        
        # Make prediction
        predicted_score = self.model.predict(features_scaled)[0]
        predicted_score = max(0, min(100, predicted_score))  # Ensure bounds
        
        # Generate recommendations
        recommendations = self._generate_recommendations(current_score, predicted_score, subject)
        
        # Get recommended topics
        recommended_topics = self._get_recommended_topics(subject, current_score)
        
        # Calculate confidence
        confidence = self._calculate_confidence(user_data)
        
        return {
            "predicted_score": round(predicted_score, 1),
            "recommended_topics": recommended_topics,
            "study_recommendations": recommendations,
            "confidence": round(confidence, 2),
            "improvement_potential": round(predicted_score - current_score, 1),
            "study_efficiency": round(study_time / max(completed_lessons, 1), 2)
        } 