from django.db import models
from django.contrib.auth import get_user_model
from courses.models import Course

User = get_user_model()


class LearningPath(models.Model):
    """Model for personalized learning paths."""
    
    DIFFICULTY_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('paused', 'Paused'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learning_paths')
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # Path configuration
    subject = models.CharField(max_length=50)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES)
    estimated_duration = models.IntegerField(help_text='Estimated duration in hours')
    
    # Progress tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    progress_percentage = models.FloatField(default=0.0)
    current_step = models.IntegerField(default=0)
    
    # AI-generated recommendations
    ai_recommendations = models.JSONField(default=list, help_text='AI-generated course recommendations')
    user_preferences = models.JSONField(default=dict, help_text='User preferences used for path generation')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'learning_paths'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"
    
    def update_progress(self, step_number, percentage):
        """Update learning path progress."""
        self.current_step = step_number
        self.progress_percentage = min(percentage, 100.0)
        
        if self.progress_percentage >= 100.0 and self.status != 'completed':
            self.status = 'completed'
            self.completed_at = models.timezone.now()
        
        self.save()
    
    def get_next_recommendations(self):
        """Get next course recommendations based on current progress."""
        if self.ai_recommendations:
            return self.ai_recommendations[self.current_step:] if self.current_step < len(self.ai_recommendations) else []
        return []


class LearningPathStep(models.Model):
    """Model for individual steps in a learning path."""
    
    STEP_TYPES = [
        ('course', 'Course'),
        ('quiz', 'Quiz'),
        ('project', 'Project'),
        ('assessment', 'Assessment'),
    ]
    
    learning_path = models.ForeignKey(LearningPath, on_delete=models.CASCADE, related_name='steps')
    title = models.CharField(max_length=200)
    description = models.TextField()
    step_type = models.CharField(max_length=20, choices=STEP_TYPES)
    
    # Content reference
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True)
    content_id = models.CharField(max_length=100, blank=True, help_text='ID of quiz, project, or assessment')
    
    # Ordering and progress
    order = models.IntegerField(default=0)
    is_completed = models.BooleanField(default=False)
    completion_date = models.DateTimeField(null=True, blank=True)
    
    # Estimated time
    estimated_duration = models.IntegerField(help_text='Estimated duration in minutes')
    
    # Prerequisites
    prerequisites = models.JSONField(default=list, help_text='List of prerequisite step IDs')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'learning_path_steps'
        ordering = ['order']
        unique_together = ['learning_path', 'order']
    
    def __str__(self):
        return f"{self.learning_path.title} - Step {self.order}: {self.title}"
    
    def mark_completed(self):
        """Mark step as completed."""
        self.is_completed = True
        self.completion_date = models.timezone.now()
        self.save()
        
        # Update learning path progress
        total_steps = self.learning_path.steps.count()
        completed_steps = self.learning_path.steps.filter(is_completed=True).count()
        progress_percentage = (completed_steps / total_steps) * 100 if total_steps > 0 else 0
        
        self.learning_path.update_progress(self.order + 1, progress_percentage)
    
    def can_start(self):
        """Check if step can be started (prerequisites met)."""
        if not self.prerequisites:
            return True
        
        completed_step_ids = self.learning_path.steps.filter(
            is_completed=True
        ).values_list('id', flat=True)
        
        return all(prereq_id in completed_step_ids for prereq_id in self.prerequisites)


class LearningPathProgress(models.Model):
    """Model for tracking detailed progress in learning paths."""
    
    learning_path = models.ForeignKey(LearningPath, on_delete=models.CASCADE, related_name='progress_records')
    step = models.ForeignKey(LearningPathStep, on_delete=models.CASCADE, related_name='progress_records')
    
    # Progress data
    time_spent = models.IntegerField(default=0, help_text='Time spent in minutes')
    score = models.FloatField(null=True, blank=True, help_text='Score if applicable')
    notes = models.TextField(blank=True)
    
    # Study session data
    study_date = models.DateTimeField(auto_now_add=True)
    session_duration = models.IntegerField(default=0, help_text='Session duration in minutes')
    
    class Meta:
        db_table = 'learning_path_progress'
        ordering = ['-study_date']
    
    def __str__(self):
        return f"{self.learning_path.title} - {self.step.title} Progress" 