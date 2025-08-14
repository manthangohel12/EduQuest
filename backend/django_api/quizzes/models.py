from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()


class Quiz(models.Model):
    """Model for quizzes and assessments."""
    
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    
    QUIZ_TYPES = [
        ('multiple_choice', 'Multiple Choice'),
        ('true_false', 'True/False'),
        ('fill_blank', 'Fill in the Blank'),
        ('matching', 'Matching'),
        ('essay', 'Essay'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    subject = models.CharField(max_length=50)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES)
    quiz_type = models.CharField(max_length=20, choices=QUIZ_TYPES)
    
    # Content
    instructions = models.TextField(blank=True)
    time_limit = models.IntegerField(help_text='Time limit in minutes', null=True, blank=True)
    passing_score = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=70,
        help_text='Passing score percentage'
    )
    
    # AI-generated content
    is_ai_generated = models.BooleanField(default=False)
    source_content = models.TextField(blank=True, help_text='Content used to generate quiz')
    ai_prompt = models.TextField(blank=True, help_text='Prompt used for AI generation')
    
    # Statistics
    total_attempts = models.IntegerField(default=0)
    average_score = models.FloatField(default=0.0)
    total_questions = models.IntegerField(default=0)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'quizzes'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    def update_statistics(self):
        """Update quiz statistics based on attempts."""
        attempts = self.attempts.all()
        if attempts.exists():
            self.total_attempts = attempts.count()
            self.average_score = sum(attempt.score for attempt in attempts) / self.total_attempts
            self.save()
    
    def get_questions_count(self):
        """Get total number of questions in the quiz."""
        return self.questions.count()


class QuizQuestion(models.Model):
    """Model for individual quiz questions."""
    
    QUESTION_TYPES = [
        ('multiple_choice', 'Multiple Choice'),
        ('true_false', 'True/False'),
        ('fill_blank', 'Fill in the Blank'),
        ('matching', 'Matching'),
        ('essay', 'Essay'),
    ]
    
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    
    # Options for multiple choice questions
    options = models.JSONField(default=list, help_text='List of answer options')
    correct_answer = models.CharField(max_length=500, help_text='Correct answer or answer key')
    
    # Scoring
    points = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    difficulty_level = models.CharField(max_length=20, choices=Quiz.DIFFICULTY_CHOICES)
    
    # AI-generated content
    is_ai_generated = models.BooleanField(default=False)
    explanation = models.TextField(blank=True, help_text='Explanation of the correct answer')
    
    # Ordering
    order = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'quiz_questions'
        ordering = ['order', 'created_at']
        unique_together = ['quiz', 'order']
    
    def __str__(self):
        return f"{self.quiz.title} - Question {self.order}"
    
    def check_answer(self, user_answer):
        """Check if user answer is correct."""
        if self.question_type == 'multiple_choice':
            return user_answer.lower().strip() == self.correct_answer.lower().strip()
        elif self.question_type == 'true_false':
            return user_answer.lower().strip() == self.correct_answer.lower().strip()
        elif self.question_type == 'fill_blank':
            return user_answer.lower().strip() == self.correct_answer.lower().strip()
        elif self.question_type == 'essay':
            # For essay questions, we'll need more sophisticated checking
            return True  # Placeholder
        return False


class QuizAttempt(models.Model):
    """Model for tracking quiz attempts."""
    
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('abandoned', 'Abandoned'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_attempts')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    
    # Progress tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    score = models.FloatField(default=0.0)
    total_points = models.IntegerField(default=0)
    correct_answers = models.IntegerField(default=0)
    total_questions = models.IntegerField(default=0)
    
    # Time tracking
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    time_taken = models.IntegerField(default=0, help_text='Time taken in seconds')
    
    # Results
    passed = models.BooleanField(default=False)
    feedback = models.TextField(blank=True)
    
    class Meta:
        db_table = 'quiz_attempts'
        ordering = ['-started_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.quiz.title}"
    
    def calculate_score(self):
        """Calculate quiz score."""
        if self.total_questions > 0:
            self.score = (self.correct_answers / self.total_questions) * 100
            self.passed = self.score >= self.quiz.passing_score
            self.save()
    
    def complete_attempt(self, time_taken):
        """Complete the quiz attempt."""
        self.status = 'completed'
        self.completed_at = models.timezone.now()
        self.time_taken = time_taken
        self.calculate_score()
        
        # Update quiz statistics
        self.quiz.update_statistics()
        
        # Update user stats
        user = self.user
        user.total_study_time += time_taken // 60  # Convert to minutes
        user.update_streak()
        
        # Add experience points based on performance
        experience_gained = int(self.score // 10)  # 1 XP per 10% score
        if experience_gained > 0:
            user.add_experience(experience_gained)
        
        self.save()


class QuizAnswer(models.Model):
    """Model for storing user answers to quiz questions."""
    
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE, related_name='answers')
    
    # User's answer
    user_answer = models.TextField()
    is_correct = models.BooleanField(default=False)
    points_earned = models.IntegerField(default=0)
    
    # Time tracking
    time_spent = models.IntegerField(default=0, help_text='Time spent on this question in seconds')
    
    # Timestamps
    answered_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'quiz_answers'
        ordering = ['answered_at']
        unique_together = ['attempt', 'question']
    
    def __str__(self):
        return f"{self.attempt.user.username} - {self.question.question_text[:50]}"
    
    def check_answer(self):
        """Check if the answer is correct and update points."""
        self.is_correct = self.question.check_answer(self.user_answer)
        if self.is_correct:
            self.points_earned = self.question.points
        else:
            self.points_earned = 0
        self.save()
        
        # Update attempt statistics
        attempt = self.attempt
        attempt.total_questions = attempt.answers.count()
        attempt.correct_answers = attempt.answers.filter(is_correct=True).count()
        attempt.total_points = sum(answer.points_earned for answer in attempt.answers.all())
        attempt.save() 