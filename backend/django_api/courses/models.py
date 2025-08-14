from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()


class Course(models.Model):
    """Course model for learning subjects."""
    
    DIFFICULTY_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    
    SUBJECT_CHOICES = [
        ('mathematics', 'Mathematics'),
        ('science', 'Science'),
        ('history', 'History'),
        ('literature', 'Literature'),
        ('programming', 'Programming'),
        ('languages', 'Languages'),
        ('art', 'Art'),
        ('music', 'Music'),
        ('business', 'Business'),
        ('technology', 'Technology'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    subject = models.CharField(max_length=50, choices=SUBJECT_CHOICES)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES)
    
    # Content
    content = models.TextField()
    video_url = models.URLField(blank=True, null=True)
    thumbnail = models.ImageField(upload_to='course_thumbnails/', null=True, blank=True)
    
    # Metadata
    duration = models.IntegerField(help_text='Duration in minutes')
    topics = models.JSONField(default=list, help_text='List of topics covered')
    prerequisites = models.JSONField(default=list, help_text='List of prerequisite course IDs')
    
    # Statistics
    total_enrollments = models.IntegerField(default=0)
    average_rating = models.FloatField(default=0.0, validators=[MinValueValidator(0), MaxValueValidator(5)])
    total_ratings = models.IntegerField(default=0)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'courses'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    def update_rating(self, new_rating):
        """Update course average rating."""
        total_score = (self.average_rating * self.total_ratings) + new_rating
        self.total_ratings += 1
        self.average_rating = total_score / self.total_ratings
        self.save()
    
    def increment_enrollment(self):
        """Increment total enrollments."""
        self.total_enrollments += 1
        self.save()


class CourseEnrollment(models.Model):
    """Model for tracking user course enrollments."""
    
    STATUS_CHOICES = [
        ('enrolled', 'Enrolled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('dropped', 'Dropped'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='enrolled')
    
    # Progress tracking
    progress_percentage = models.FloatField(default=0.0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    current_topic = models.CharField(max_length=100, blank=True)
    
    # Study session data
    total_study_time = models.IntegerField(default=0, help_text='Total study time in minutes')
    last_studied = models.DateTimeField(null=True, blank=True)
    
    # Completion data
    completed_at = models.DateTimeField(null=True, blank=True)
    rating = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)])
    review = models.TextField(blank=True)
    
    # Timestamps
    enrolled_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'course_enrollments'
        unique_together = ['user', 'course']
        ordering = ['-enrolled_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.course.title}"
    
    def update_progress(self, percentage, topic=None):
        """Update course progress."""
        self.progress_percentage = min(percentage, 100.0)
        if topic:
            self.current_topic = topic
        
        if self.progress_percentage >= 100.0 and self.status != 'completed':
            self.status = 'completed'
            self.completed_at = models.timezone.now()
        
        self.save()
    
    def add_study_time(self, minutes):
        """Add study time to the enrollment."""
        self.total_study_time += minutes
        self.last_studied = models.timezone.now()
        self.save()
    
    def rate_course(self, rating, review=''):
        """Rate the course."""
        if 1 <= rating <= 5:
            self.rating = rating
            self.review = review
            self.course.update_rating(rating)
            self.save()


class Topic(models.Model):
    """Model for course topics/sections."""
    
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='course_topics')
    title = models.CharField(max_length=200)
    description = models.TextField()
    content = models.TextField()
    
    # Ordering
    order = models.IntegerField(default=0)
    
    # Media
    video_url = models.URLField(blank=True, null=True)
    resources = models.JSONField(default=list, help_text='List of resource URLs')
    
    # Statistics
    duration = models.IntegerField(help_text='Duration in minutes')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'topics'
        ordering = ['order', 'created_at']
        unique_together = ['course', 'order']
    
    def __str__(self):
        return f"{self.course.title} - {self.title}" 