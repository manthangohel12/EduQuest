from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from courses.models import Course
from progress.models import Progress, LearningStreak
from django.utils import timezone

User = get_user_model()

class Command(BaseCommand):
    help = 'Create sample progress data for testing'

    def handle(self, *args, **options):
        # Get or create a test user
        user, created = User.objects.get_or_create(
            username='testuser',
            defaults={
                'email': 'test@example.com',
                'first_name': 'Test',
                'last_name': 'User'
            }
        )
        
        if created:
            self.stdout.write(f'Created test user: {user.username}')
        else:
            self.stdout.write(f'Using existing user: {user.username}')
        
        # Get or create a test course
        course, created = Course.objects.get_or_create(
            title='Sample Course',
            defaults={
                'description': 'A sample course for testing',
                'subject': 'programming',
                'difficulty': 'beginner',
                'content': 'This is a sample course content for testing purposes.',
                'duration': 120,
                'topics': ['Introduction', 'Basics', 'Advanced Concepts'],
                'prerequisites': []
            }
        )
        
        if created:
            self.stdout.write(f'Created test course: {course.title}')
        else:
            self.stdout.write(f'Using existing course: {course.title}')
        
        # Create progress record
        progress, created = Progress.objects.get_or_create(
            user=user,
            course=course,
            defaults={
                'completion_percentage': 75.0,
                'time_spent': 120,  # 2 hours
                'quiz_scores': [85, 90, 78],
                'average_quiz_score': 84.33,
                'total_quizzes_taken': 3,
                'strengths': ['Programming', 'Problem Solving'],
                'weaknesses': ['Advanced Algorithms']
            }
        )
        
        if created:
            self.stdout.write(f'Created progress record for {user.username} - {course.title}')
        else:
            # Update existing progress
            progress.completion_percentage = 75.0
            progress.time_spent = 120
            progress.quiz_scores = [85, 90, 78]
            progress.average_quiz_score = 84.33
            progress.total_quizzes_taken = 3
            progress.strengths = ['Programming', 'Problem Solving']
            progress.weaknesses = ['Advanced Algorithms']
            progress.save()
            self.stdout.write(f'Updated progress record for {user.username} - {course.title}')
        
        # Create learning streak
        streak, created = LearningStreak.objects.get_or_create(
            user=user,
            defaults={
                'current_streak': 5,
                'longest_streak': 10,
                'total_study_days': 15,
                'last_study_date': timezone.now().date(),
                'study_dates': [
                    (timezone.now().date() - timezone.timedelta(days=i)).isoformat()
                    for i in range(5)
                ],
                'milestones_achieved': ['first_day', 'week_streak']
            }
        )
        
        if created:
            self.stdout.write(f'Created learning streak for {user.username}')
        else:
            streak.current_streak = 5
            streak.longest_streak = 10
            streak.total_study_days = 15
            streak.save()
            self.stdout.write(f'Updated learning streak for {user.username}')
        
        
        
        self.stdout.write(
            self.style.SUCCESS('Successfully created sample data for testing summary generation!')
        ) 