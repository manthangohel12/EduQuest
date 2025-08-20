from rest_framework import serializers
from .models import StudySession, StudyGoal, StudyAnalytics


class StudySessionSerializer(serializers.ModelSerializer):
    """Serializer for StudySession model."""
    
    user = serializers.ReadOnlyField(source='user.username')
    duration_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = StudySession
        fields = [
            'id', 'user', 'title', 'description', 'session_type',
            'course', 'content_id', 'started_at', 'ended_at', 'duration',
            'duration_formatted', 'topics_covered', 'progress_percentage',
            'notes', 'mood_rating', 'focus_rating', 'ai_insights',
            'recommendations', 'is_active', 'is_completed'
        ]
        read_only_fields = ['id', 'started_at', 'ended_at', 'duration']
    
    def get_duration_formatted(self, obj):
        """Format duration in hours and minutes."""
        if obj.duration:
            hours = obj.duration // 60
            minutes = obj.duration % 60
            if hours > 0:
                return f"{hours}h {minutes}m"
            return f"{minutes}m"
        return "0m"
    
    def create(self, validated_data):
        """Create a new study session."""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class StudySessionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating study sessions."""
    
    class Meta:
        model = StudySession
        fields = [
            'title', 'description', 'session_type', 'course',
            'content_id', 'topics_covered', 'mood_rating', 'focus_rating'
        ]
    
    def create(self, validated_data):
        """Create a new study session."""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class StudySessionUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating study sessions."""
    
    class Meta:
        model = StudySession
        fields = [
            'title', 'description', 'session_type', 'course',
            'content_id', 'topics_covered', 'progress_percentage',
            'notes', 'mood_rating', 'focus_rating'
        ]


class StudySessionEndSerializer(serializers.ModelSerializer):
    """Serializer for ending study sessions."""
    
    class Meta:
        model = StudySession
        fields = ['notes', 'mood_rating', 'focus_rating']
    
    def update(self, instance, validated_data):
        """End the study session."""
        instance.end_session(notes=validated_data.get('notes', ''))
        return instance


class StudyGoalSerializer(serializers.ModelSerializer):
    """Serializer for StudyGoal model."""
    
    user = serializers.ReadOnlyField(source='user.username')
    completion_percentage = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = StudyGoal
        fields = [
            'id', 'user', 'title', 'description', 'goal_type',
            'target_study_time', 'target_sessions', 'target_progress',
            'start_date', 'end_date', 'current_study_time',
            'current_sessions', 'current_progress', 'status',
            'completion_percentage', 'days_remaining', 'created_at',
            'updated_at', 'completed_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'completed_at']
    
    def get_completion_percentage(self, obj):
        """Get overall completion percentage."""
        return obj.get_completion_percentage()
    
    def get_days_remaining(self, obj):
        """Get days remaining until goal deadline."""
        from django.utils import timezone
        today = timezone.now().date()
        if obj.end_date > today:
            return (obj.end_date - today).days
        return 0
    
    def create(self, validated_data):
        """Create a new study goal."""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class StudyGoalCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating study goals."""
    
    class Meta:
        model = StudyGoal
        fields = [
            'title', 'description', 'goal_type', 'target_study_time',
            'target_sessions', 'target_progress', 'start_date', 'end_date'
        ]
    
    def create(self, validated_data):
        """Create a new study goal."""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class StudyGoalUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating study goals."""
    
    class Meta:
        model = StudyGoal
        fields = [
            'title', 'description', 'goal_type', 'target_study_time',
            'target_sessions', 'target_progress', 'start_date', 'end_date'
        ]


class StudyAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for StudyAnalytics model."""
    
    user = serializers.ReadOnlyField(source='user.username')
    study_time_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = StudyAnalytics
        fields = [
            'id', 'user', 'date', 'total_study_time', 'sessions_count',
            'average_session_duration', 'focus_score', 'mood_score',
            'productivity_score',
            'insights', 'recommendations', 'study_time_formatted',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_study_time_formatted(self, obj):
        """Format study time in hours and minutes."""
        if obj.total_study_time:
            hours = obj.total_study_time // 60
            minutes = obj.total_study_time % 60
            if hours > 0:
                return f"{hours}h {minutes}m"
            return f"{minutes}m"
        return "0m"


class StudySessionSummarySerializer(serializers.Serializer):
    """Serializer for study session summary statistics."""
    
    total_sessions = serializers.IntegerField()
    total_study_time = serializers.IntegerField()
    average_session_duration = serializers.FloatField()
    current_streak = serializers.IntegerField()
    longest_streak = serializers.IntegerField()
    weekly_progress = serializers.ListField(child=serializers.DictField())
    monthly_progress = serializers.ListField(child=serializers.DictField())


class StudyInsightsSerializer(serializers.Serializer):
    """Serializer for AI-generated study insights."""
    
    productivity_trend = serializers.CharField()
    recommended_study_time = serializers.CharField()
    focus_improvements = serializers.ListField(child=serializers.CharField())
    study_pattern_analysis = serializers.DictField()
    next_week_goals = serializers.ListField(child=serializers.CharField())


class StudyGoalProgressSerializer(serializers.Serializer):
    """Serializer for study goal progress updates."""
    
    study_time = serializers.IntegerField(required=False)
    sessions = serializers.IntegerField(required=False)
    progress = serializers.FloatField(required=False)


class StudyAnalyticsRequestSerializer(serializers.Serializer):
    """Serializer for study analytics request parameters."""
    
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    period = serializers.CharField(required=False, default='week') 