from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model

User = get_user_model()


class AIExplanation(models.Model):
    """Model for AI-generated explanations and content simplification."""
    
    DIFFICULTY_LEVELS = [
        ('elementary', 'Elementary'),
        ('middle_school', 'Middle School'),
        ('high_school', 'High School'),
        ('college', 'College'),
        ('expert', 'Expert'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_explanations')
    
    # Original content
    original_content = models.TextField()
    content_type = models.CharField(max_length=50, help_text='Type of content (text, pdf, video, etc.)')
    source_url = models.URLField(blank=True, null=True)
    
    # Simplified content
    simplified_content = models.TextField()
    summary = models.TextField(blank=True, help_text='AI-generated summary of the content')
    difficulty_level = models.CharField(max_length=20, choices=DIFFICULTY_LEVELS)
    
    # AI processing
    ai_model_used = models.CharField(max_length=100, help_text='AI model used for processing')
    processing_time = models.FloatField(default=0.0, help_text='Processing time in seconds')
    
    # Additional features
    key_concepts = models.JSONField(default=list, help_text='List of key concepts extracted')
    definitions = models.JSONField(default=dict, help_text='Dictionary of term definitions')
    examples = models.JSONField(default=list, help_text='List of examples provided')
    
    # User interaction
    is_favorite = models.BooleanField(default=False)
    rating = models.IntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    feedback = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ai_explanations'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.content_type} explanation"
    
    def add_rating(self, rating, feedback=''):
        """Add user rating and feedback."""
        self.rating = rating
        self.feedback = feedback
        self.save()
    
    def toggle_favorite(self):
        """Toggle favorite status."""
        self.is_favorite = not self.is_favorite
        self.save()


class ContentAnalysis(models.Model):
    """Model for detailed content analysis."""
    
    explanation = models.OneToOneField(AIExplanation, on_delete=models.CASCADE, related_name='analysis')
    
    # Text analysis
    readability_score = models.FloatField(default=0.0, help_text='Flesch reading ease score')
    complexity_score = models.FloatField(default=0.0, help_text='Text complexity score')
    word_count = models.IntegerField(default=0)
    sentence_count = models.IntegerField(default=0)
    
    # Language analysis
    language_detected = models.CharField(max_length=10, default='en')
    sentiment_score = models.FloatField(default=0.0, help_text='Sentiment analysis score')
    
    # Topic analysis
    topics = models.JSONField(default=list, help_text='List of identified topics')
    entities = models.JSONField(default=list, help_text='Named entities found')
    keywords = models.JSONField(default=list, help_text='Key terms and phrases')
    
    # Learning insights
    learning_objectives = models.JSONField(default=list, help_text='Identified learning objectives')
    prerequisite_knowledge = models.JSONField(default=list, help_text='Required background knowledge')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'content_analysis'
    
    def __str__(self):
        return f"Analysis for {self.explanation}"


class ExplanationTemplate(models.Model):
    """Model for reusable explanation templates."""
    
    TEMPLATE_TYPES = [
        ('concept', 'Concept Explanation'),
        ('process', 'Process Description'),
        ('comparison', 'Comparison'),
        ('example', 'Example Generation'),
        ('summary', 'Summary'),
    ]
    
    name = models.CharField(max_length=200)
    template_type = models.CharField(max_length=20, choices=TEMPLATE_TYPES)
    description = models.TextField()
    
    # Template content
    prompt_template = models.TextField(help_text='AI prompt template')
    output_format = models.JSONField(default=dict, help_text='Expected output format')
    
    # Configuration
    difficulty_levels = models.JSONField(default=list, help_text='Supported difficulty levels')
    subjects = models.JSONField(default=list, help_text='Applicable subjects')
    
    # Usage statistics
    usage_count = models.IntegerField(default=0)
    average_rating = models.FloatField(default=0.0)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'explanation_templates'
        ordering = ['-usage_count']
    
    def __str__(self):
        return self.name
    
    def increment_usage(self):
        """Increment usage count."""
        self.usage_count += 1
        self.save()
    
    def update_rating(self, new_rating):
        """Update average rating."""
        total_rating = self.average_rating * (self.usage_count - 1) + new_rating
        self.average_rating = total_rating / self.usage_count
        self.save()


class ExplanationHistory(models.Model):
    """Model for tracking explanation generation history."""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='explanation_history')
    template = models.ForeignKey(ExplanationTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Request data
    original_content = models.TextField()
    requested_difficulty = models.CharField(max_length=20, choices=AIExplanation.DIFFICULTY_LEVELS)
    content_type = models.CharField(max_length=50)
    
    # Response data
    simplified_content = models.TextField()
    processing_time = models.FloatField(default=0.0)
    ai_model_used = models.CharField(max_length=100)
    
    # User feedback
    user_rating = models.IntegerField(null=True, blank=True)
    user_feedback = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'explanation_history'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.created_at}"


class AIProcessingJob(models.Model):
    """Model for tracking AI processing jobs."""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_jobs')
    job_type = models.CharField(max_length=50, help_text='Type of AI processing job')
    
    # Job data
    input_data = models.JSONField(default=dict, help_text='Input data for processing')
    output_data = models.JSONField(default=dict, help_text='Output data from processing')
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    progress_percentage = models.FloatField(default=0.0)
    
    # Error handling
    error_message = models.TextField(blank=True)
    retry_count = models.IntegerField(default=0)
    
    # Performance metrics
    processing_time = models.FloatField(default=0.0)
    model_used = models.CharField(max_length=100, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'ai_processing_jobs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.job_type} - {self.status}"
    
    def start_processing(self):
        """Mark job as started."""
        from django.utils import timezone
        self.status = 'processing'
        self.started_at = timezone.now()
        self.save()
    
    def complete_job(self, output_data, processing_time=0.0):
        """Mark job as completed."""
        from django.utils import timezone
        self.status = 'completed'
        self.output_data = output_data
        self.processing_time = processing_time
        self.completed_at = timezone.now()
        self.progress_percentage = 100.0
        self.save()
    
    def fail_job(self, error_message):
        """Mark job as failed."""
        self.status = 'failed'
        self.error_message = error_message
        self.save() 