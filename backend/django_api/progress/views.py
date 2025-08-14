from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q, Avg, Sum, Count
from django.utils import timezone
from datetime import timedelta
from .models import Progress, LearningStreak, SubjectProgress, LearningAnalytics
from .serializers import (
    ProgressSerializer,
    ProgressUpdateSerializer,
    LearningStreakSerializer,
    SubjectProgressSerializer,
    SubjectProgressUpdateSerializer,
    LearningAnalyticsSerializer,
    ProgressSummarySerializer,
    SubjectBreakdownSerializer,
    LearningInsightsSerializer,
    ProgressChartSerializer
)


class ProgressListView(generics.ListAPIView):
    """View for listing user's course progress."""
    serializer_class = ProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Progress.objects.filter(user=self.request.user)


class ProgressDetailView(generics.RetrieveUpdateAPIView):
    """View for course progress details."""
    serializer_class = ProgressUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Progress.objects.filter(user=self.request.user)


class LearningStreakView(generics.RetrieveAPIView):
    """View for learning streak information."""
    serializer_class = LearningStreakSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        streak, created = LearningStreak.objects.get_or_create(user=self.request.user)
        return streak


class SubjectProgressListView(generics.ListAPIView):
    """View for listing subject progress."""
    serializer_class = SubjectProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SubjectProgress.objects.filter(user=self.request.user)


class SubjectProgressDetailView(generics.RetrieveUpdateAPIView):
    """View for subject progress details."""
    serializer_class = SubjectProgressUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SubjectProgress.objects.filter(user=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_course_progress(request, course_id):
    """Update progress for a specific course."""
    progress, created = Progress.objects.get_or_create(
        user=request.user,
        course_id=course_id
    )
    
    serializer = ProgressUpdateSerializer(progress, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        
        return Response({
            'message': 'Progress updated successfully.',
            'completion_percentage': progress.completion_percentage,
            'time_spent': progress.time_spent
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_quiz_score(request, course_id):
    """Add a quiz score to course progress."""
    progress = get_object_or_404(Progress, user=request.user, course_id=course_id)
    
    score = request.data.get('score')
    if score is None or not (0 <= score <= 100):
        return Response(
            {'error': 'Valid score (0-100) is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    progress.add_quiz_score(score)
    
    return Response({
        'message': 'Quiz score added successfully.',
        'average_quiz_score': progress.average_quiz_score,
        'total_quizzes_taken': progress.total_quizzes_taken
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_progress_summary(request):
    """Get overall progress summary."""
    user = request.user
    
    # Get progress data
    progress_records = Progress.objects.filter(user=user)
    total_courses = progress_records.count()
    completed_courses = progress_records.filter(completion_percentage=100).count()
    total_study_time = progress_records.aggregate(Sum('time_spent'))['time_spent__sum'] or 0
    average_completion = progress_records.aggregate(Avg('completion_percentage'))['completion_percentage__avg'] or 0
    
    # Get streak data
    streak, created = LearningStreak.objects.get_or_create(user=user)
    
    # Get quiz data
    total_quizzes_taken = progress_records.aggregate(Sum('total_quizzes_taken'))['total_quizzes_taken__sum'] or 0
    average_quiz_score = progress_records.aggregate(Avg('average_quiz_score'))['average_quiz_score__avg'] or 0
    
    # Add debug logging
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Progress summary for user {user.username}:")
    logger.info(f"  Total courses: {total_courses}")
    logger.info(f"  Completed courses: {completed_courses}")
    logger.info(f"  Total study time: {total_study_time}")
    logger.info(f"  Average completion: {average_completion}")
    logger.info(f"  Current streak: {streak.current_streak}")
    logger.info(f"  Total quizzes: {total_quizzes_taken}")
    logger.info(f"  Average quiz score: {average_quiz_score}")
    
    summary = {
        'total_courses': total_courses,
        'completed_courses': completed_courses,
        'total_study_time': total_study_time,
        'average_completion': round(average_completion, 2),
        'current_streak': streak.current_streak,
        'longest_streak': streak.longest_streak,
        'total_quizzes_taken': total_quizzes_taken,
        'average_quiz_score': round(average_quiz_score, 2)
    }
    
    return Response(summary, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_subject_breakdown(request):
    """Get progress breakdown by subject."""
    user = request.user
    
    subject_progress = SubjectProgress.objects.filter(user=user)
    breakdown = []
    
    for subject in subject_progress:
        # Calculate completion percentage
        total_courses = subject.courses_enrolled
        completed_courses = subject.courses_completed
        completion_percentage = (completed_courses / total_courses * 100) if total_courses > 0 else 0
        
        breakdown.append({
            'subject': subject.subject,
            'courses_enrolled': subject.courses_enrolled,
            'courses_completed': subject.courses_completed,
            'total_time_spent': subject.total_time_spent,
            'average_score': round(subject.average_score, 2),
            'completion_percentage': round(completion_percentage, 2)
        })
    
    return Response(breakdown, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_learning_insights(request):
    """Get AI-generated learning insights."""
    user = request.user
    
    # Get progress data for analysis
    progress_records = Progress.objects.filter(user=user)
    subject_progress = SubjectProgress.objects.filter(user=user)
    
    if not progress_records.exists():
        return Response({
            'insights': [],
            'recommendations': [],
            'strengths': [],
            'weaknesses': [],
            'learning_patterns': {}
        }, status=status.HTTP_200_OK)
    
    # Calculate insights (simplified version)
    total_courses = progress_records.count()
    completed_courses = progress_records.filter(completion_percentage=100).count()
    average_completion = progress_records.aggregate(Avg('completion_percentage'))['completion_percentage__avg'] or 0
    average_quiz_score = progress_records.aggregate(Avg('average_quiz_score'))['average_quiz_score__avg'] or 0
    
    insights = [
        f"You have enrolled in {total_courses} courses and completed {completed_courses}.",
        f"Your average course completion rate is {round(average_completion, 1)}%.",
        f"Your average quiz score is {round(average_quiz_score, 1)}%."
    ]
    
    recommendations = [
        "Focus on completing one course at a time for better retention.",
        "Take more quizzes to improve your understanding of topics.",
        "Set specific study goals to maintain motivation."
    ]
    
    # Get strengths and weaknesses from progress records
    all_strengths = []
    all_weaknesses = []
    
    for progress in progress_records:
        all_strengths.extend(progress.strengths)
        all_weaknesses.extend(progress.weaknesses)
    
    strengths = list(set(all_strengths))[:5]  # Top 5 strengths
    weaknesses = list(set(all_weaknesses))[:5]  # Top 5 weaknesses
    
    learning_patterns = {
        'preferred_subjects': [sp.subject for sp in subject_progress.order_by('-total_time_spent')[:3]],
        'study_intensity': 'moderate' if average_completion > 50 else 'low',
        'quiz_performance': 'good' if average_quiz_score > 70 else 'needs_improvement'
    }
    
    return Response({
        'insights': insights,
        'recommendations': recommendations,
        'strengths': strengths,
        'weaknesses': weaknesses,
        'learning_patterns': learning_patterns
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_progress_chart_data(request):
    """Get progress chart data for visualization."""
    user = request.user
    
    # Get date range from request
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=30)  # Default to last 30 days
    
    if 'start_date' in request.query_params:
        start_date = request.query_params['start_date']
    if 'end_date' in request.query_params:
        end_date = request.query_params['end_date']
    
    # Get progress records in date range
    progress_records = Progress.objects.filter(
        user=user,
        updated_at__date__range=[start_date, end_date]
    ).order_by('updated_at')
    
    # Prepare chart data
    labels = []
    completion_data = []
    time_data = []
    
    for progress in progress_records:
        date_str = progress.updated_at.strftime('%Y-%m-%d')
        if date_str not in labels:
            labels.append(date_str)
            completion_data.append(progress.completion_percentage)
            time_data.append(progress.time_spent)
    
    chart_data = {
        'labels': labels,
        'datasets': [
            {
                'label': 'Completion Percentage',
                'data': completion_data,
                'borderColor': 'rgb(75, 192, 192)',
                'backgroundColor': 'rgba(75, 192, 192, 0.2)'
            },
            {
                'label': 'Study Time (minutes)',
                'data': time_data,
                'borderColor': 'rgb(255, 99, 132)',
                'backgroundColor': 'rgba(255, 99, 132, 0.2)'
            }
        ]
    }
    
    return Response(chart_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_streak(request):
    """Update learning streak."""
    streak, created = LearningStreak.objects.get_or_create(user=request.user)
    
    study_date = request.data.get('study_date')
    if study_date:
        from datetime import datetime
        study_date = datetime.strptime(study_date, '%Y-%m-%d').date()
    else:
        study_date = timezone.now().date()
    
    streak.update_streak(study_date)
    streak.check_milestones()
    
    return Response({
        'message': 'Streak updated successfully.',
        'current_streak': streak.current_streak,
        'longest_streak': streak.longest_streak,
        'total_study_days': streak.total_study_days,
        'milestones_achieved': streak.milestones_achieved
    }, status=status.HTTP_200_OK) 