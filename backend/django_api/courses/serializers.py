from rest_framework import serializers
from .models import Course, CourseEnrollment, Topic


class TopicSerializer(serializers.ModelSerializer):
    """Serializer for course topics."""
    
    class Meta:
        model = Topic
        fields = [
            'id', 'title', 'description', 'content', 'order',
            'video_url', 'resources', 'duration', 'created_at'
        ]


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for course listing."""
    topics = TopicSerializer(many=True, read_only=True)
    
    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'subject', 'difficulty',
            'content', 'video_url', 'thumbnail', 'duration', 'topics',
            'prerequisites', 'total_enrollments', 'average_rating',
            'total_ratings', 'is_active', 'is_featured', 'created_at'
        ]


class CourseDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for course information."""
    topics = TopicSerializer(many=True, read_only=True)
    
    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'subject', 'difficulty',
            'content', 'video_url', 'thumbnail', 'duration', 'topics',
            'prerequisites', 'total_enrollments', 'average_rating',
            'total_ratings', 'is_active', 'is_featured', 'created_at'
        ]


class CourseEnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for course enrollments."""
    course = CourseSerializer(read_only=True)
    course_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = CourseEnrollment
        fields = [
            'id', 'course', 'course_id', 'status', 'progress_percentage',
            'current_topic', 'total_study_time', 'last_studied',
            'completed_at', 'rating', 'review', 'enrolled_at'
        ]
        read_only_fields = [
            'id', 'course', 'status', 'progress_percentage',
            'current_topic', 'total_study_time', 'last_studied',
            'completed_at', 'rating', 'review', 'enrolled_at'
        ]


class CourseEnrollmentUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating course enrollment progress."""
    
    class Meta:
        model = CourseEnrollment
        fields = [
            'progress_percentage', 'current_topic', 'rating', 'review'
        ]


class CourseRatingSerializer(serializers.Serializer):
    """Serializer for course ratings."""
    rating = serializers.IntegerField(min_value=1, max_value=5)
    review = serializers.CharField(max_length=1000, required=False, allow_blank=True)


class CourseSearchSerializer(serializers.Serializer):
    """Serializer for course search parameters."""
    subject = serializers.CharField(required=False)
    difficulty = serializers.CharField(required=False)
    search = serializers.CharField(required=False)
    featured = serializers.BooleanField(required=False)
    min_rating = serializers.FloatField(required=False, min_value=0, max_value=5) 