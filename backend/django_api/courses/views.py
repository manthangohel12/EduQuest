from rest_framework import status, generics, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Avg
from django.shortcuts import get_object_or_404
from .models import Course, CourseEnrollment, Topic
from .serializers import (
    CourseSerializer,
    CourseDetailSerializer,
    CourseEnrollmentSerializer,
    CourseEnrollmentUpdateSerializer,
    CourseRatingSerializer,
    CourseSearchSerializer
)


class CourseListView(generics.ListAPIView):
    """View for listing all courses with filtering."""
    queryset = Course.objects.filter(is_active=True)
    serializer_class = CourseSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'subject']
    ordering_fields = ['created_at', 'average_rating', 'total_enrollments', 'duration']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by subject
        subject = self.request.query_params.get('subject')
        if subject:
            queryset = queryset.filter(subject=subject)
        
        # Filter by difficulty
        difficulty = self.request.query_params.get('difficulty')
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        
        # Filter by featured courses
        featured = self.request.query_params.get('featured')
        if featured and featured.lower() == 'true':
            queryset = queryset.filter(is_featured=True)
        
        # Filter by minimum rating
        min_rating = self.request.query_params.get('min_rating')
        if min_rating:
            try:
                min_rating = float(min_rating)
                queryset = queryset.filter(average_rating__gte=min_rating)
            except ValueError:
                pass
        
        return queryset


class CourseDetailView(generics.RetrieveAPIView):
    """View for detailed course information."""
    queryset = Course.objects.filter(is_active=True)
    serializer_class = CourseDetailSerializer
    permission_classes = [permissions.AllowAny]


class CourseEnrollmentView(generics.CreateAPIView):
    """View for enrolling in a course."""
    serializer_class = CourseEnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        course_id = serializer.validated_data['course_id']
        course = get_object_or_404(Course, id=course_id, is_active=True)
        
        # Check if user is already enrolled
        enrollment, created = CourseEnrollment.objects.get_or_create(
            user=self.request.user,
            course=course,
            defaults={'status': 'enrolled'}
        )
        
        if created:
            course.increment_enrollment()
        
        serializer.instance = enrollment


class UserEnrollmentsView(generics.ListAPIView):
    """View for listing user's course enrollments."""
    serializer_class = CourseEnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return CourseEnrollment.objects.filter(user=self.request.user)


class EnrollmentDetailView(generics.RetrieveUpdateAPIView):
    """View for enrollment details and progress updates."""
    serializer_class = CourseEnrollmentUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return CourseEnrollment.objects.filter(user=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_course_progress(request, enrollment_id):
    """Update course progress."""
    enrollment = get_object_or_404(CourseEnrollment, id=enrollment_id, user=request.user)
    
    progress = request.data.get('progress_percentage', 0)
    topic = request.data.get('current_topic', '')
    study_time = request.data.get('study_time', 0)
    
    # Update progress
    enrollment.update_progress(progress, topic)
    
    # Add study time
    if study_time > 0:
        enrollment.add_study_time(study_time)
    
    # Update user stats
    user = request.user
    user.total_study_time += study_time
    user.update_streak()
    
    # Add experience points
    experience_gained = study_time // 10
    if experience_gained > 0:
        user.add_experience(experience_gained)
    
    return Response({
        'message': 'Progress updated successfully.',
        'progress_percentage': enrollment.progress_percentage,
        'current_topic': enrollment.current_topic,
        'total_study_time': enrollment.total_study_time,
        'experience_gained': experience_gained
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def rate_course(request, enrollment_id):
    """Rate a completed course."""
    enrollment = get_object_or_404(CourseEnrollment, id=enrollment_id, user=request.user)
    
    if enrollment.status != 'completed':
        return Response(
            {'error': 'Course must be completed before rating.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = CourseRatingSerializer(data=request.data)
    if serializer.is_valid():
        rating = serializer.validated_data['rating']
        review = serializer.validated_data.get('review', '')
        
        enrollment.rate_course(rating, review)
        
        return Response({
            'message': 'Course rated successfully.',
            'rating': rating,
            'review': review
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def course_statistics(request):
    """Get course statistics."""
    total_courses = Course.objects.filter(is_active=True).count()
    total_enrollments = CourseEnrollment.objects.count()
    avg_rating = Course.objects.filter(is_active=True).aggregate(Avg('average_rating'))['average_rating__avg'] or 0
    
    subject_stats = {}
    for subject, _ in Course.SUBJECT_CHOICES:
        count = Course.objects.filter(subject=subject, is_active=True).count()
        if count > 0:
            subject_stats[subject] = count
    
    return Response({
        'total_courses': total_courses,
        'total_enrollments': total_enrollments,
        'average_rating': round(avg_rating, 2),
        'subject_distribution': subject_stats
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def recommended_courses(request):
    """Get recommended courses based on user preferences."""
    user = request.user
    
    # Get courses matching user's difficulty preference
    difficulty = user.difficulty_preference
    
    queryset = Course.objects.filter(is_active=True)
    
    if difficulty:
        queryset = queryset.filter(difficulty=difficulty)
    
    # Exclude courses user is already enrolled in
    enrolled_course_ids = CourseEnrollment.objects.filter(
        user=user
    ).values_list('course_id', flat=True)
    
    queryset = queryset.exclude(id__in=enrolled_course_ids)
    
    # Order by rating and enrollment count
    recommended_courses = queryset.order_by('-average_rating', '-total_enrollments')[:10]
    
    serializer = CourseSerializer(recommended_courses, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK) 