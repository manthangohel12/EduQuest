from rest_framework import serializers
from .models import AIExplanation, ContentAnalysis, ExplanationTemplate, ExplanationHistory, AIProcessingJob


class ContentAnalysisSerializer(serializers.ModelSerializer):
    """Serializer for content analysis."""
    
    class Meta:
        model = ContentAnalysis
        fields = [
            'id', 'readability_score', 'complexity_score', 'word_count', 'sentence_count',
            'language_detected', 'sentiment_score', 'topics', 'entities', 'keywords',
            'learning_objectives', 'prerequisite_knowledge', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AIExplanationSerializer(serializers.ModelSerializer):
    """Serializer for AI explanations."""
    analysis = ContentAnalysisSerializer(read_only=True)
    
    class Meta:
        model = AIExplanation
        fields = [
            'id', 'original_content', 'content_type', 'source_url', 'simplified_content',
            'summary', 'difficulty_level', 'ai_model_used', 'processing_time', 'key_concepts',
            'definitions', 'examples', 'is_favorite', 'rating', 'feedback',
            'analysis', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'ai_model_used', 'processing_time', 'created_at', 'updated_at'
        ]


class AIExplanationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating AI explanations."""
    
    class Meta:
        model = AIExplanation
        fields = [
            'original_content', 'simplified_content', 'summary', 'content_type',
            'difficulty_level', 'key_concepts', 'definitions', 'examples'
        ]
        extra_kwargs = {
            'simplified_content': {'required': False},  # Make this optional
            'summary': {'required': False},  # Make this optional
            'key_concepts': {'required': False},
            'definitions': {'required': False},
            'examples': {'required': False},
        }
    
    def validate_difficulty_level(self, value):
        """Validate difficulty level against model choices."""
        valid_choices = [choice[0] for choice in AIExplanation.DIFFICULTY_LEVELS]
        if value not in valid_choices:
            raise serializers.ValidationError(
                f"Invalid difficulty level. Must be one of: {', '.join(valid_choices)}"
            )
        return value
    
    def validate(self, attrs):
        """Validate the entire data."""
        # Ensure required fields are present
        if not attrs.get('original_content'):
            raise serializers.ValidationError("Original content is required.")
        
        if not attrs.get('content_type'):
            raise serializers.ValidationError("Content type is required.")
        
        # Set defaults for optional fields
        attrs.setdefault('simplified_content', '')
        attrs.setdefault('key_concepts', [])
        attrs.setdefault('definitions', {})
        attrs.setdefault('examples', [])
        
        return attrs
    
    def create(self, validated_data):
        """Create the AI explanation instance."""
        try:
            return super().create(validated_data)
        except Exception as e:
            raise serializers.ValidationError(f"Failed to create AI explanation: {str(e)}")


class AIExplanationUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating AI explanations."""
    
    class Meta:
        model = AIExplanation
        fields = [
            'is_favorite', 'rating', 'feedback'
        ]


class ExplanationTemplateSerializer(serializers.ModelSerializer):
    """Serializer for explanation templates."""
    
    class Meta:
        model = ExplanationTemplate
        fields = [
            'id', 'name', 'template_type', 'description', 'prompt_template',
            'output_format', 'difficulty_levels', 'subjects', 'usage_count',
            'average_rating', 'is_active', 'is_featured', 'created_at'
        ]
        read_only_fields = [
            'id', 'usage_count', 'average_rating', 'created_at'
        ]


class ExplanationHistorySerializer(serializers.ModelSerializer):
    """Serializer for explanation history."""
    template = ExplanationTemplateSerializer(read_only=True)
    
    class Meta:
        model = ExplanationHistory
        fields = [
            'id', 'template', 'original_content', 'requested_difficulty',
            'content_type', 'simplified_content', 'processing_time', 'ai_model_used',
            'user_rating', 'user_feedback', 'created_at'
        ]
        read_only_fields = [
            'id', 'simplified_content', 'processing_time', 'ai_model_used', 'created_at'
        ]


class AIProcessingJobSerializer(serializers.ModelSerializer):
    """Serializer for AI processing jobs."""
    
    class Meta:
        model = AIProcessingJob
        fields = [
            'id', 'job_type', 'input_data', 'output_data', 'status',
            'progress_percentage', 'error_message', 'retry_count',
            'processing_time', 'model_used', 'created_at', 'started_at', 'completed_at'
        ]
        read_only_fields = [
            'id', 'output_data', 'status', 'progress_percentage', 'error_message',
            'retry_count', 'processing_time', 'model_used', 'created_at',
            'started_at', 'completed_at'
        ]


class AIProcessingJobCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating AI processing jobs."""
    
    class Meta:
        model = AIProcessingJob
        fields = [
            'job_type', 'input_data'
        ]


class ContentSimplificationRequestSerializer(serializers.Serializer):
    """Serializer for content simplification requests."""
    content = serializers.CharField(required=True)
    content_type = serializers.CharField(required=True)
    difficulty_level = serializers.CharField(required=True)
    source_url = serializers.URLField(required=False, allow_blank=True)
    include_definitions = serializers.BooleanField(default=True)
    include_examples = serializers.BooleanField(default=True)
    include_key_concepts = serializers.BooleanField(default=True)


class ExplanationTemplateRequestSerializer(serializers.Serializer):
    """Serializer for explanation template requests."""
    template_id = serializers.IntegerField(required=False)
    template_type = serializers.CharField(required=False)
    content = serializers.CharField(required=True)
    difficulty_level = serializers.CharField(required=True)
    subject = serializers.CharField(required=False)


class AIExplanationFeedbackSerializer(serializers.Serializer):
    """Serializer for AI explanation feedback."""
    rating = serializers.IntegerField(min_value=1, max_value=5, required=True)
    feedback = serializers.CharField(required=False, allow_blank=True)


class ContentAnalysisRequestSerializer(serializers.Serializer):
    """Serializer for content analysis requests."""
    content = serializers.CharField(required=True)
    include_sentiment = serializers.BooleanField(default=True)
    include_topics = serializers.BooleanField(default=True)
    include_entities = serializers.BooleanField(default=True)
    include_keywords = serializers.BooleanField(default=True)


class BatchProcessingRequestSerializer(serializers.Serializer):
    """Serializer for batch processing requests."""
    contents = serializers.ListField(
        child=serializers.CharField(),
        min_length=1,
        max_length=10
    )
    difficulty_level = serializers.CharField(required=True)
    content_type = serializers.CharField(required=True) 