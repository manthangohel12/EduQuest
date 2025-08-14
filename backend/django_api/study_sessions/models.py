from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model
from courses.models import Course

User = get_user_model()


class StudySession(models.Model):
    """Model for tracking study sessions."""
    
    SESSION_TYPES = [
        ('course_study', 'Course Study'),
        ('quiz_practice', 'Quiz Practice'),
        ('content_review', 'Content Review'),
        ('project_work', 'Project Work'),
        ('reading', 'Reading'),
        ('video_watching', 'Video Watching'),
        ('other', 'Other'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='study_sessions')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    session_type = models.CharField(max_length=20, choices=SESSION_TYPES)
    
    # Content reference
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True)
    content_id = models.CharField(max_length=100, blank=True, help_text='ID of specific content being studied')
    
    # Time tracking
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration = models.IntegerField(default=0, help_text='Duration in minutes')
    
    # Progress tracking
    topics_covered = models.JSONField(default=list, help_text='List of topics covered')
    progress_percentage = models.FloatField(default=0.0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    
    # Session data
    notes = models.TextField(blank=True)
    mood_rating = models.IntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text='Mood rating from 1-10'
    )
    focus_rating = models.IntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text='Focus rating from 1-10'
    )
    
    # AI insights
    ai_insights = models.JSONField(default=dict, help_text='AI-generated insights about the session')
    recommendations = models.JSONField(default=list, help_text='AI recommendations for future sessions')
    
    # Status
    is_active = models.BooleanField(default=True)
    is_completed = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'study_sessions'
        ordering = ['-started_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"
    
    def end_session(self, duration=None, notes=''):
        """End the study session."""
        self.ended_at = models.timezone.now()
        if duration:
            self.duration = duration
        else:
            # Calculate duration from start time
            time_diff = self.ended_at - self.started_at
            self.duration = int(time_diff.total_seconds() / 60)
        
        self.notes = notes
        self.is_completed = True
        self.is_active = False
        self.save()
        
        # Update user stats
        user = self.user
        user.total_study_time += self.duration
        user.update_streak()
        
        # Add experience points
        experience_gained = self.duration // 10  # 1 XP per 10 minutes
        if experience_gained > 0:
            user.add_experience(experience_gained)
    
    def add_topic(self, topic):
        """Add a topic to the session."""
        if topic not in self.topics_covered:
            self.topics_covered.append(topic)
            self.save()
    
    def update_progress(self, percentage):
        """Update session progress."""
        self.progress_percentage = min(percentage, 100.0)
        self.save()


class StudyGoal(models.Model):
    """Model for tracking study goals."""
    
    GOAL_TYPES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('custom', 'Custom'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('paused', 'Paused'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='study_goals')
    title = models.CharField(max_length=200)
    description = models.TextField()
    goal_type = models.CharField(max_length=20, choices=GOAL_TYPES)
    
    # Target metrics
    target_study_time = models.IntegerField(help_text='Target study time in minutes')
    target_sessions = models.IntegerField(default=1, help_text='Target number of sessions')
    target_progress = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Target progress percentage'
    )
    
    # Time period
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Progress tracking
    current_study_time = models.IntegerField(default=0)
    current_sessions = models.IntegerField(default=0)
    current_progress = models.FloatField(default=0.0)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'study_goals'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"
    
    def update_progress(self, study_time=0, sessions=0, progress=0):
        """Update goal progress."""
        self.current_study_time += study_time
        self.current_sessions += sessions
        self.current_progress = max(self.current_progress, progress)
        
        # Check if goal is completed
        if (self.current_study_time >= self.target_study_time and
            self.current_sessions >= self.target_sessions and
            self.current_progress >= self.target_progress):
            self.status = 'completed'
            self.completed_at = models.timezone.now()
        
        self.save()
    
    def get_completion_percentage(self):
        """Get overall completion percentage."""
        time_percentage = min(self.current_study_time / self.target_study_time, 1.0) if self.target_study_time > 0 else 0
        sessions_percentage = min(self.current_sessions / self.target_sessions, 1.0) if self.target_sessions > 0 else 0
        progress_percentage = min(self.current_progress / self.target_progress, 1.0) if self.target_progress > 0 else 0
        
        return (time_percentage + sessions_percentage + progress_percentage) / 3 * 100


class StudyAnalytics(models.Model):
    """Model for storing study analytics and insights."""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='study_analytics')
    date = models.DateField()
    
    # Daily metrics
    total_study_time = models.IntegerField(default=0, help_text='Total study time in minutes')
    sessions_count = models.IntegerField(default=0)
    average_session_duration = models.FloatField(default=0.0)
    
    # Performance metrics
    focus_score = models.FloatField(default=0.0, help_text='Average focus rating')
    mood_score = models.FloatField(default=0.0, help_text='Average mood rating')
    productivity_score = models.FloatField(default=0.0, help_text='Calculated productivity score')
    
    # Subject breakdown
    subjects_studied = models.JSONField(default=list, help_text='List of subjects studied')
    subject_time_breakdown = models.JSONField(default=dict, help_text='Time spent per subject')
    
    # AI insights
    insights = models.JSONField(default=dict, help_text='AI-generated insights for the day')
    recommendations = models.JSONField(default=list, help_text='AI recommendations')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'study_analytics'
        ordering = ['-date']
        unique_together = ['user', 'date']
    
    def __str__(self):
        return f"{self.user.username} - {self.date}"
    
    def calculate_productivity_score(self):
        """Calculate productivity score based on various factors."""
        # Simple formula: (focus_score + mood_score) * (total_study_time / 60) / 100
        if self.total_study_time > 0:
            self.productivity_score = (
                (self.focus_score + self.mood_score) * 
                (self.total_study_time / 60) / 100
            )
        else:
            self.productivity_score = 0
        self.save() 