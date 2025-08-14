from rest_framework import serializers
from .models import Progress, LearningStreak, SubjectProgress, LearningAnalytics
from courses.serializers import CourseSerializer


class ProgressSerializer(serializers.ModelSerializer):
    """Serializer for course progress."""
    course = CourseSerializer(read_only=True)
    
    class Meta:
        model = Progress
        fields = [
            'id', 'course', 'completion_percentage', 'time_spent', 'last_accessed',
            'quiz_scores', 'average_quiz_score', 'total_quizzes_taken',
            'strengths', 'weaknesses', 'ai_recommendations', 'learning_patterns',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'last_accessed', 'quiz_scores', 'average_quiz_score',
            'total_quizzes_taken', 'created_at', 'updated_at'
        ]


class ProgressUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating progress."""
    
    class Meta:
        model = Progress
        fields = [
            'completion_percentage', 'time_spent', 'strengths', 'weaknesses'
        ]


class LearningStreakSerializer(serializers.ModelSerializer):
    """Serializer for learning streaks."""
    
    class Meta:
        model = LearningStreak
        fields = [
            'id', 'current_streak', 'longest_streak', 'total_study_days',
            'last_study_date', 'study_dates', 'milestones_achieved',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'current_streak', 'longest_streak', 'total_study_days',
            'last_study_date', 'study_dates', 'milestones_achieved',
            'created_at', 'updated_at'
        ]


class SubjectProgressSerializer(serializers.ModelSerializer):
    """Serializer for subject progress."""
    
    class Meta:
        model = SubjectProgress
        fields = [
            'id', 'subject', 'courses_enrolled', 'courses_completed',
            'total_time_spent', 'average_score', 'topics_covered',
            'difficulty_level', 'preferred_learning_methods', 'study_patterns',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'courses_enrolled', 'courses_completed', 'created_at', 'updated_at'
        ]


class SubjectProgressUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating subject progress."""
    
    class Meta:
        model = SubjectProgress
        fields = [
            'total_time_spent', 'average_score', 'topics_covered',
            'difficulty_level', 'preferred_learning_methods', 'study_patterns'
        ]


class LearningAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for learning analytics."""
    
    class Meta:
        model = LearningAnalytics
        fields = [
            'id', 'date', 'study_time', 'sessions_count', 'courses_accessed',
            'quizzes_taken', 'average_quiz_score', 'focus_score',
            'productivity_score', 'preferred_subjects', 'study_times',
            'learning_methods', 'insights', 'recommendations', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ProgressSummarySerializer(serializers.Serializer):
    """Serializer for progress summary."""
    total_courses = serializers.IntegerField()
    completed_courses = serializers.IntegerField()
    total_study_time = serializers.IntegerField()
    average_completion = serializers.FloatField()
    current_streak = serializers.IntegerField()
    longest_streak = serializers.IntegerField()
    total_quizzes_taken = serializers.IntegerField()
    average_quiz_score = serializers.FloatField()


class SubjectBreakdownSerializer(serializers.Serializer):
    """Serializer for subject breakdown."""
    subject = serializers.CharField()
    courses_enrolled = serializers.IntegerField()
    courses_completed = serializers.IntegerField()
    total_time_spent = serializers.IntegerField()
    average_score = serializers.FloatField()
    completion_percentage = serializers.FloatField()


class LearningInsightsSerializer(serializers.Serializer):
    """Serializer for learning insights."""
    insights = serializers.ListField(child=serializers.CharField())
    recommendations = serializers.ListField(child=serializers.CharField())
    strengths = serializers.ListField(child=serializers.CharField())
    weaknesses = serializers.ListField(child=serializers.CharField())
    learning_patterns = serializers.DictField()


class ProgressChartSerializer(serializers.Serializer):
    """Serializer for progress chart data."""
    labels = serializers.ListField(child=serializers.CharField())
    datasets = serializers.ListField(child=serializers.DictField()) 