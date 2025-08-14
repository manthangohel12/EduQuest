from rest_framework import serializers
from .models import Quiz, QuizQuestion, QuizAttempt, QuizAnswer


class QuizQuestionSerializer(serializers.ModelSerializer):
    """Serializer for quiz questions."""
    
    class Meta:
        model = QuizQuestion
        fields = [
            'id', 'question_text', 'question_type', 'options', 'order',
            'points', 'difficulty_level', 'explanation', 'created_at'
        ]
        read_only_fields = ['id', 'explanation', 'created_at']


class QuizQuestionDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for quiz questions (includes correct answer for review)."""
    
    class Meta:
        model = QuizQuestion
        fields = [
            'id', 'question_text', 'question_type', 'options', 'correct_answer',
            'order', 'points', 'difficulty_level', 'explanation', 'created_at'
        ]


class QuizSerializer(serializers.ModelSerializer):
    """Serializer for quiz listing."""
    questions = QuizQuestionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Quiz
        fields = [
            'id', 'title', 'description', 'subject', 'difficulty', 'quiz_type',
            'instructions', 'time_limit', 'passing_score', 'total_attempts',
            'average_score', 'total_questions', 'is_active', 'is_featured',
            'questions', 'created_at'
        ]


class QuizDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for quiz information."""
    questions = QuizQuestionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Quiz
        fields = [
            'id', 'title', 'description', 'subject', 'difficulty', 'quiz_type',
            'instructions', 'time_limit', 'passing_score', 'is_ai_generated',
            'source_content', 'ai_prompt', 'total_attempts', 'average_score',
            'total_questions', 'is_active', 'is_featured', 'questions',
            'created_at', 'updated_at'
        ]


class QuizAttemptSerializer(serializers.ModelSerializer):
    """Serializer for quiz attempts."""
    quiz = QuizSerializer(read_only=True)
    
    class Meta:
        model = QuizAttempt
        fields = [
            'id', 'quiz', 'status', 'score', 'total_points', 'correct_answers',
            'total_questions', 'started_at', 'completed_at', 'time_taken',
            'passed', 'feedback'
        ]
        read_only_fields = [
            'id', 'quiz', 'status', 'score', 'total_points', 'correct_answers',
            'total_questions', 'started_at', 'completed_at', 'time_taken',
            'passed', 'feedback'
        ]


class QuizAttemptCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating quiz attempts."""
    
    class Meta:
        model = QuizAttempt
        fields = ['quiz']


class QuizAnswerSerializer(serializers.ModelSerializer):
    """Serializer for quiz answers."""
    question = QuizQuestionSerializer(read_only=True)
    
    class Meta:
        model = QuizAnswer
        fields = [
            'id', 'question', 'user_answer', 'is_correct', 'points_earned',
            'time_spent', 'answered_at'
        ]
        read_only_fields = ['id', 'is_correct', 'points_earned', 'answered_at']


class QuizAnswerCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating quiz answers."""
    
    class Meta:
        model = QuizAnswer
        fields = ['question', 'user_answer', 'time_spent']


class QuizGenerationSerializer(serializers.Serializer):
    """Serializer for quiz generation requests."""
    subject = serializers.CharField(required=True)
    difficulty = serializers.CharField(required=True)
    quiz_type = serializers.CharField(required=True)
    num_questions = serializers.IntegerField(min_value=1, max_value=50, default=10)
    source_content = serializers.CharField(required=False, allow_blank=True)
    time_limit = serializers.IntegerField(required=False, min_value=5, max_value=180)
    passing_score = serializers.IntegerField(required=False, min_value=0, max_value=100, default=70)


class QuizSearchSerializer(serializers.Serializer):
    """Serializer for quiz search parameters."""
    subject = serializers.CharField(required=False)
    difficulty = serializers.CharField(required=False)
    quiz_type = serializers.CharField(required=False)
    search = serializers.CharField(required=False)
    featured = serializers.BooleanField(required=False)
    ai_generated = serializers.BooleanField(required=False)


class QuizResultSerializer(serializers.ModelSerializer):
    """Serializer for quiz results."""
    quiz = QuizSerializer(read_only=True)
    answers = QuizAnswerSerializer(many=True, read_only=True)
    
    class Meta:
        model = QuizAttempt
        fields = [
            'id', 'quiz', 'status', 'score', 'total_points', 'correct_answers',
            'total_questions', 'started_at', 'completed_at', 'time_taken',
            'passed', 'feedback', 'answers'
        ] 