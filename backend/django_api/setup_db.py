#!/usr/bin/env python
"""
Database setup script for EduQuest Django API.
This script initializes the database with sample data.
"""

import os
import sys
import django
from django.utils import timezone
from datetime import timedelta

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eduquest.settings')
django.setup()

from django.contrib.auth import get_user_model
from courses.models import Course, CourseEnrollment, Topic
from quizzes.models import Quiz, QuizQuestion, QuizAttempt
from study_sessions.models import StudySession, StudyGoal, StudyAnalytics
from progress.models import Progress, LearningStreak
from learning_paths.models import LearningPath, LearningPathStep
from ai_explanations.models import AIExplanation, ContentAnalysis

User = get_user_model()

def create_sample_data():
    """Create sample data for the EduQuest platform."""
    print("Creating sample data for EduQuest...")
    
    # Create sample users
    try:
        # Create admin user
        admin_user, created = User.objects.get_or_create(
            email='admin@eduquest.com',
            defaults={
                'username': 'admin',
                'first_name': 'Admin',
                'last_name': 'User',
                'is_staff': True,
                'is_superuser': True,
                'learning_style': 'visual',
                'difficulty_preference': 'intermediate'
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            print("✓ Created admin user")
        
        # Create sample user
        sample_user, created = User.objects.get_or_create(
            email='student@eduquest.com',
            defaults={
                'username': 'student',
                'first_name': 'John',
                'last_name': 'Doe',
                'learning_style': 'kinesthetic',
                'difficulty_preference': 'beginner',
                
            }
        )
        if created:
            sample_user.set_password('student123')
            sample_user.save()
            print("✓ Created sample user")
        
        # Create sample courses
        course1, created = Course.objects.get_or_create(
            title='Introduction to Python Programming',
            defaults={
                'description': 'Learn the basics of Python programming language',
                'subject': 'programming',
                'difficulty': 'beginner',
                'content': 'Python is a high-level programming language...',
                'duration': 120,
                'topics': ['Variables', 'Data Types', 'Control Structures'],
                'prerequisites': [],
                'is_active': True,
                'is_featured': True
            }
        )
        if created:
            print("✓ Created sample course: Introduction to Python Programming")
        
        course2, created = Course.objects.get_or_create(
            title='Advanced Mathematics',
            defaults={
                'description': 'Advanced mathematical concepts and problem solving',
                'subject': 'mathematics',
                'difficulty': 'advanced',
                'content': 'Advanced mathematics covers complex topics...',
                'duration': 180,
                'topics': ['Calculus', 'Linear Algebra', 'Statistics'],
                'prerequisites': [],
                'is_active': True,
                'is_featured': False
            }
        )
        if created:
            print("✓ Created sample course: Advanced Mathematics")
        
        # Create sample quizzes
        quiz1, created = Quiz.objects.get_or_create(
            title='Python Basics Quiz',
            defaults={
                'description': 'Test your knowledge of Python fundamentals',
                'subject': 'programming',
                'difficulty': 'easy',
                'quiz_type': 'multiple_choice',
                'instructions': 'Answer all questions to test your Python knowledge',
                'time_limit': 30,
                'passing_score': 70,
                'is_active': True
            }
        )
        if created:
            print("✓ Created sample quiz: Python Basics Quiz")
            
            # Create quiz questions
            questions_data = [
                {
                    'question_text': 'What is the correct way to declare a variable in Python?',
                    'question_type': 'multiple_choice',
                    'options': ['var x = 5', 'x = 5', 'let x = 5', 'const x = 5'],
                    'correct_answer': 'x = 5',
                    'points': 1,
                    'difficulty_level': 'easy',
                    'explanation': 'In Python, variables are declared by simply assigning a value.'
                },
                {
                    'question_text': 'Which of the following is a Python data type?',
                    'question_type': 'multiple_choice',
                    'options': ['int', 'string', 'list', 'All of the above'],
                    'correct_answer': 'All of the above',
                    'points': 1,
                    'difficulty_level': 'easy',
                    'explanation': 'Python has many built-in data types including int, string, and list.'
                }
            ]
            
            for i, q_data in enumerate(questions_data):
                QuizQuestion.objects.get_or_create(
                    quiz=quiz1,
                    order=i,
                    defaults={
                        'question_text': q_data['question_text'],
                        'question_type': q_data['question_type'],
                        'options': q_data['options'],
                        'correct_answer': q_data['correct_answer'],
                        'points': q_data['points'],
                        'difficulty_level': q_data['difficulty_level'],
                        'explanation': q_data['explanation']
                    }
                )
        
        # Create sample study session
        session1, created = StudySession.objects.get_or_create(
            user=sample_user,
            title='Python Study Session',
            defaults={
                'description': 'Studying Python programming basics',
                'session_type': 'course_study',
                'course': course1,
                'duration': 45,
                'topics_covered': ['Variables', 'Data Types'],
                'progress_percentage': 60.0,
                'notes': 'Good progress on Python basics',
                'mood_rating': 8,
                'focus_rating': 7,
                'is_completed': True
            }
        )
        if created:
            print("✓ Created sample study session")
        
        # Create sample learning path
        path1, created = LearningPath.objects.get_or_create(
            user=sample_user,
            title='Python Learning Path',
            defaults={
                'description': 'Complete path to learn Python programming',
                'subject': 'programming',
                'difficulty': 'beginner',
                'estimated_duration': 20,
                'status': 'active',
                'progress_percentage': 25.0,
                'current_step': 1,
                'ai_recommendations': [
                    {'course_id': course1.id, 'title': 'Python Basics'},
                    {'course_id': course2.id, 'title': 'Advanced Concepts'}
                ]
            }
        )
        if created:
            print("✓ Created sample learning path")
        
        # Create sample progress records
        progress1, created = Progress.objects.get_or_create(
            user=sample_user,
            course=course1,
            defaults={
                'completion_percentage': 60.0,
                'time_spent': 90,
                'quiz_scores': [85, 92, 78],
                'average_quiz_score': 85.0,
                'total_quizzes_taken': 3,
                'strengths': ['Variables', 'Data Types'],
                'weaknesses': ['Advanced Functions']
            }
        )
        if created:
            print("✓ Created sample progress record")
        
        # Create sample AI explanation
        explanation1, created = AIExplanation.objects.get_or_create(
            user=sample_user,
            original_content='Python variables are containers for storing data values.',
            defaults={
                'content_type': 'text',
                'simplified_content': 'Variables in Python are like boxes that store information. You can put different types of data in them.',
                'difficulty_level': 'elementary',
                'ai_model_used': 'BERT-base',
                'processing_time': 2.5,
                'key_concepts': ['Variables', 'Data Storage', 'Python'],
                'definitions': {
                    'variable': 'A container for storing data values',
                    'data type': 'The type of data stored in a variable'
                },
                'examples': [
                    'x = 5  # storing a number',
                    'name = "John"  # storing text'
                ]
            }
        )
        if created:
            print("✓ Created sample AI explanation")
        
        print("\n✅ Sample data creation completed successfully!")
        print(f"Admin user: admin@eduquest.com / admin123")
        print(f"Sample user: student@eduquest.com / student123")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        return False
    
    return True

def main():
    """Main function to run the database setup."""
    print("🚀 Setting up EduQuest database...")
    
    # Run migrations
    print("Running Django migrations...")
    os.system('python manage.py makemigrations')
    os.system('python manage.py migrate')
    
    # Create sample data
    success = create_sample_data()
    
    if success:
        print("\n🎉 Database setup completed successfully!")
        print("You can now start the EduQuest platform.")
    else:
        print("\n❌ Database setup failed. Please check the error messages above.")

if __name__ == '__main__':
    main() 