from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model
from courses.models import Course

User = get_user_model()


class Progress(models.Model):
    """Model for tracking overall learning progress."""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress_records')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='progress_records')
    
    # Progress metrics
    completion_percentage = models.FloatField(default=0.0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    time_spent = models.IntegerField(default=0, help_text='Time spent in minutes')
    last_accessed = models.DateTimeField(auto_now=True)
    
    # Learning metrics
    quiz_scores = models.JSONField(default=list, help_text='List of quiz scores')
    average_quiz_score = models.FloatField(default=0.0)
    total_quizzes_taken = models.IntegerField(default=0)
    
    # Strengths and weaknesses
    strengths = models.JSONField(default=list, help_text='List of strong topics')
    weaknesses = models.JSONField(default=list, help_text='List of weak topics')
    
    # AI insights
    ai_recommendations = models.JSONField(default=list, help_text='AI-generated recommendations')
    learning_patterns = models.JSONField(default=dict, help_text='Identified learning patterns')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'progress'
        unique_together = ['user', 'course']
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.course.title}"
    
    def update_completion(self, percentage):
        """Update completion percentage."""
        self.completion_percentage = min(percentage, 100.0)
        self.save()
    
    def add_quiz_score(self, score):
        """Add a quiz score and update average."""
        self.quiz_scores.append(score)
        self.total_quizzes_taken += 1
        self.average_quiz_score = sum(self.quiz_scores) / len(self.quiz_scores)
        self.save()
    
    def update_strengths_weaknesses(self, strong_topics, weak_topics):
        """Update strengths and weaknesses."""
        self.strengths = strong_topics
        self.weaknesses = weak_topics
        self.save()


class LearningStreak(models.Model):
    """Model for tracking learning streaks."""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learning_streaks')
    
    # Streak data
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    total_study_days = models.IntegerField(default=0)
    
    # Daily tracking
    last_study_date = models.DateField(null=True, blank=True)
    study_dates = models.JSONField(default=list, help_text='List of study dates')
    
    # Streak milestones
    milestones_achieved = models.JSONField(default=list, help_text='List of achieved milestones')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'learning_streaks'
        unique_together = ['user']
    
    def __str__(self):
        return f"{self.user.username} - Learning Streak"
    
    def update_streak(self, study_date):
        """Update learning streak."""
        from django.utils import timezone
        
        today = timezone.now().date()
        
        if study_date == today:
            if self.last_study_date:
                days_diff = (today - self.last_study_date).days
                
                if days_diff == 1:  # Consecutive day
                    self.current_streak += 1
                elif days_diff > 1:  # Streak broken
                    self.current_streak = 1
                # If days_diff == 0, same day, don't change streak
            else:
                self.current_streak = 1
            
            if self.current_streak > self.longest_streak:
                self.longest_streak = self.current_streak
            
            if study_date not in self.study_dates:
                self.study_dates.append(study_date.isoformat())
                self.total_study_days += 1
            
            self.last_study_date = study_date
            self.save()
    
    def check_milestones(self):
        """Check and update milestones."""
        milestones = [
            {'name': 'first_day', 'requirement': 1, 'description': 'First study day'},
            {'name': 'week_streak', 'requirement': 7, 'description': '7-day streak'},
            {'name': 'month_streak', 'requirement': 30, 'description': '30-day streak'},
            {'name': 'hundred_days', 'requirement': 100, 'description': '100 study days'}
        ]
        
        for milestone in milestones:
            if (milestone['name'] not in self.milestones_achieved and
                self.total_study_days >= milestone['requirement']):
                self.milestones_achieved.append(milestone['name'])
        
        self.save()


class SubjectProgress(models.Model):
    """Model for tracking progress by subject."""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subject_progress')
    subject = models.CharField(max_length=50)
    
    # Progress metrics
    courses_enrolled = models.IntegerField(default=0)
    courses_completed = models.IntegerField(default=0)
    total_time_spent = models.IntegerField(default=0, help_text='Total time in minutes')
    average_score = models.FloatField(default=0.0)
    
    # Subject-specific data
    topics_covered = models.JSONField(default=list, help_text='List of topics covered')
    difficulty_level = models.CharField(max_length=20, choices=[
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced')
    ], default='beginner')
    
    # Learning insights
    preferred_learning_methods = models.JSONField(default=list, help_text='Preferred learning methods')
    study_patterns = models.JSONField(default=dict, help_text='Study patterns for this subject')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'subject_progress'
        unique_together = ['user', 'subject']
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.subject}"
    
    def update_progress(self, time_spent=0, score=None):
        """Update subject progress."""
        self.total_time_spent += time_spent
        
        if score is not None:
            # Update average score
            if self.average_score == 0:
                self.average_score = score
            else:
                self.average_score = (self.average_score + score) / 2
        
        self.save()
    
    def add_topic(self, topic):
        """Add a topic to covered topics."""
        if topic not in self.topics_covered:
            self.topics_covered.append(topic)
            self.save()


class LearningAnalytics(models.Model):
    """Model for storing detailed learning analytics."""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learning_analytics')
    date = models.DateField()
    
    # Daily metrics
    study_time = models.IntegerField(default=0, help_text='Study time in minutes')
    sessions_count = models.IntegerField(default=0)
    courses_accessed = models.IntegerField(default=0)
    quizzes_taken = models.IntegerField(default=0)
    
    # Performance metrics
    average_quiz_score = models.FloatField(default=0.0)
    focus_score = models.FloatField(default=0.0)
    productivity_score = models.FloatField(default=0.0)
    
    # Learning patterns
    preferred_subjects = models.JSONField(default=list, help_text='Most studied subjects')
    study_times = models.JSONField(default=list, help_text='Study session times')
    learning_methods = models.JSONField(default=list, help_text='Learning methods used')
    
    # AI insights
    insights = models.JSONField(default=dict, help_text='AI-generated insights')
    recommendations = models.JSONField(default=list, help_text='AI recommendations')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'learning_analytics'
        unique_together = ['user', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.user.username} - {self.date}"
    
    def calculate_productivity_score(self):
        """Calculate productivity score based on various factors."""
        # Simple formula: (focus_score + average_quiz_score) * (study_time / 60) / 100
        if self.study_time > 0:
            self.productivity_score = (
                (self.focus_score + self.average_quiz_score) * 
                (self.study_time / 60) / 100
            )
        else:
            self.productivity_score = 0
        self.save() 