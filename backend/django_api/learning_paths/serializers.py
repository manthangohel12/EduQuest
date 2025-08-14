from rest_framework import serializers
from .models import LearningPath, LearningPathStep, LearningPathProgress
from courses.serializers import CourseSerializer


class LearningPathStepSerializer(serializers.ModelSerializer):
    """Serializer for learning path steps."""
    course = CourseSerializer(read_only=True)
    
    class Meta:
        model = LearningPathStep
        fields = [
            'id', 'title', 'description', 'step_type', 'course', 'content_id',
            'order', 'is_completed', 'completion_date', 'estimated_duration',
            'prerequisites', 'created_at'
        ]
        read_only_fields = ['id', 'is_completed', 'completion_date', 'created_at']


class LearningPathProgressSerializer(serializers.ModelSerializer):
    """Serializer for learning path progress records."""
    
    class Meta:
        model = LearningPathProgress
        fields = [
            'id', 'step', 'time_spent', 'score', 'notes', 'study_date',
            'session_duration'
        ]
        read_only_fields = ['id', 'study_date']


class LearningPathSerializer(serializers.ModelSerializer):
    """Serializer for learning paths."""
    steps = LearningPathStepSerializer(many=True, read_only=True)
    current_step_data = serializers.SerializerMethodField()
    
    class Meta:
        model = LearningPath
        fields = [
            'id', 'title', 'description', 'subject', 'difficulty',
            'estimated_duration', 'status', 'progress_percentage',
            'current_step', 'ai_recommendations', 'user_preferences',
            'steps', 'current_step_data', 'created_at', 'updated_at',
            'completed_at'
        ]
        read_only_fields = [
            'id', 'progress_percentage', 'current_step', 'created_at',
            'updated_at', 'completed_at'
        ]
    
    def get_current_step_data(self, obj):
        """Get current step information."""
        if obj.current_step > 0 and obj.steps.exists():
            current_step = obj.steps.filter(order=obj.current_step).first()
            if current_step:
                return {
                    'id': current_step.id,
                    'title': current_step.title,
                    'description': current_step.description,
                    'step_type': current_step.step_type,
                    'can_start': current_step.can_start()
                }
        return None


class LearningPathDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for learning paths."""
    steps = LearningPathStepSerializer(many=True, read_only=True)
    progress_records = LearningPathProgressSerializer(many=True, read_only=True)
    
    class Meta:
        model = LearningPath
        fields = [
            'id', 'title', 'description', 'subject', 'difficulty',
            'estimated_duration', 'status', 'progress_percentage',
            'current_step', 'ai_recommendations', 'user_preferences',
            'steps', 'progress_records', 'created_at', 'updated_at',
            'completed_at'
        ]


class LearningPathCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating learning paths."""
    
    class Meta:
        model = LearningPath
        fields = [
            'title', 'description', 'subject', 'difficulty',
            'estimated_duration', 'user_preferences'
        ]


class LearningPathStepUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating learning path steps."""
    
    class Meta:
        model = LearningPathStep
        fields = ['is_completed', 'notes']


class LearningPathProgressCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating progress records."""
    
    class Meta:
        model = LearningPathProgress
        fields = ['step', 'time_spent', 'score', 'notes', 'session_duration']


class LearningPathRecommendationSerializer(serializers.Serializer):
    """Serializer for learning path recommendations."""
    subject = serializers.CharField(required=True)
    difficulty = serializers.CharField(required=True)
    learning_goals = serializers.ListField(child=serializers.CharField(), required=False)
    time_available = serializers.IntegerField(required=False, help_text='Available time in hours')
    preferred_learning_style = serializers.CharField(required=False) 