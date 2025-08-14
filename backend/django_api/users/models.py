from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    """Custom User model with learning preferences."""
    
    # Basic profile fields
    email = models.EmailField(unique=True)
    bio = models.TextField(max_length=500, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    
    # Learning preferences
    preferred_subjects = models.JSONField(default=list, blank=True)
    learning_style = models.CharField(
        max_length=20,
        choices=[
            ('visual', 'Visual'),
            ('auditory', 'Auditory'),
            ('kinesthetic', 'Kinesthetic'),
            ('reading', 'Reading/Writing'),
        ],
        default='visual'
    )
    difficulty_preference = models.CharField(
        max_length=20,
        choices=[
            ('beginner', 'Beginner'),
            ('intermediate', 'Intermediate'),
            ('advanced', 'Advanced'),
        ],
        default='intermediate'
    )
    
    # Learning statistics
    total_study_time = models.IntegerField(default=0)  # in minutes
    total_courses_completed = models.IntegerField(default=0)
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_study_date = models.DateTimeField(null=True, blank=True)
    
    # Gamification
    experience_points = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    badges = models.JSONField(default=list, blank=True)
    
    # Settings
    notifications_enabled = models.BooleanField(default=True)
    email_notifications = models.BooleanField(default=True)
    study_reminders = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return self.email
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username
    
    def add_experience(self, points):
        """Add experience points and handle leveling up."""
        self.experience_points += points
        
        # Calculate new level (simple formula: level = sqrt(xp/100) + 1)
        new_level = int((self.experience_points / 100) ** 0.5) + 1
        
        if new_level > self.level:
            self.level = new_level
            # Add level up badge
            if 'level_up' not in self.badges:
                self.badges.append('level_up')
        
        self.save()
    
    def update_streak(self):
        """Update study streak."""
        today = timezone.now().date()
        
        if self.last_study_date:
            last_study = self.last_study_date.date()
            days_diff = (today - last_study).days
            
            if days_diff == 1:  # Consecutive day
                self.current_streak += 1
            elif days_diff > 1:  # Streak broken
                self.current_streak = 1
            # If days_diff == 0, same day, don't change streak
        else:
            self.current_streak = 1
        
        if self.current_streak > self.longest_streak:
            self.longest_streak = self.current_streak
        
        self.last_study_date = timezone.now()
        self.save()
    
    def add_badge(self, badge_name):
        """Add a badge to the user."""
        if badge_name not in self.badges:
            self.badges.append(badge_name)
            self.save()
    
    def get_study_stats(self):
        """Get comprehensive study statistics."""
        return {
            'total_study_time': self.total_study_time,
            'total_courses_completed': self.total_courses_completed,
            'current_streak': self.current_streak,
            'longest_streak': self.longest_streak,
            'experience_points': self.experience_points,
            'level': self.level,
            'badges': self.badges,
        } 