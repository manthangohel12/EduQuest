from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q, Avg, Sum
from django.utils import timezone
from datetime import timedelta
from .models import StudySession, StudyGoal, StudyAnalytics
from .serializers import (
    StudySessionSerializer,
    StudySessionCreateSerializer,
    StudySessionUpdateSerializer,
    StudyGoalSerializer,
    StudyGoalCreateSerializer,
    StudyAnalyticsSerializer,
    StudySessionEndSerializer,
    StudyGoalProgressSerializer,
    StudyAnalyticsRequestSerializer
)


class StudySessionListView(generics.ListCreateAPIView):
    """View for listing and creating study sessions."""
    serializer_class = StudySessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return StudySession.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StudySessionCreateSerializer
        return StudySessionSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class StudySessionDetailView(generics.RetrieveUpdateAPIView):
    """View for study session details."""
    serializer_class = StudySessionUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return StudySession.objects.filter(user=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def end_study_session(request, session_id):
    """End a study session."""
    session = get_object_or_404(StudySession, id=session_id, user=request.user)
    
    if not session.is_active:
        return Response(
            {'error': 'Session is already ended.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = StudySessionEndSerializer(data=request.data)
    if serializer.is_valid():
        duration = serializer.validated_data.get('duration')
        notes = serializer.validated_data.get('notes', '')
        mood_rating = serializer.validated_data.get('mood_rating')
        focus_rating = serializer.validated_data.get('focus_rating')
        
        session.end_session(duration, notes)
        
        if mood_rating:
            session.mood_rating = mood_rating
        if focus_rating:
            session.focus_rating = focus_rating
        
        session.save()
        
        return Response({
            'message': 'Study session ended successfully.',
            'session_id': session.id,
            'duration': session.duration,
            'experience_gained': session.duration // 10
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_session_progress(request, session_id):
    """Update study session progress."""
    session = get_object_or_404(StudySession, id=session_id, user=request.user)
    
    progress = request.data.get('progress_percentage', 0)
    topics = request.data.get('topics_covered', [])
    
    session.update_progress(progress)
    
    for topic in topics:
        session.add_topic(topic)
    
    return Response({
        'message': 'Session progress updated successfully.',
        'progress_percentage': session.progress_percentage,
        'topics_covered': session.topics_covered
    }, status=status.HTTP_200_OK)


class StudyGoalListView(generics.ListCreateAPIView):
    """View for listing and creating study goals."""
    serializer_class = StudyGoalSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return StudyGoal.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StudyGoalCreateSerializer
        return StudyGoalSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class StudyGoalDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View for study goal details."""
    serializer_class = StudyGoalSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return StudyGoal.objects.filter(user=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_goal_progress(request, goal_id):
    """Update study goal progress."""
    goal = get_object_or_404(StudyGoal, id=goal_id, user=request.user)
    
    serializer = StudyGoalProgressSerializer(data=request.data)
    if serializer.is_valid():
        study_time = serializer.validated_data.get('study_time', 0)
        sessions = serializer.validated_data.get('sessions', 0)
        progress = serializer.validated_data.get('progress', 0)
        
        goal.update_progress(study_time, sessions, progress)
        
        return Response({
            'message': 'Goal progress updated successfully.',
            'completion_percentage': goal.get_completion_percentage(),
            'status': goal.status
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_study_analytics(request):
    """Get study analytics for the user."""
    user = request.user
    
    # Get date range from request
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=30)  # Default to last 30 days
    
    if 'start_date' in request.query_params:
        start_date = request.query_params['start_date']
    if 'end_date' in request.query_params:
        end_date = request.query_params['end_date']
    
    # Get sessions in date range
    sessions = StudySession.objects.filter(
        user=user,
        started_at__date__range=[start_date, end_date],
        is_completed=True
    )
    
    # Calculate analytics
    total_study_time = sessions.aggregate(Sum('duration'))['duration__sum'] or 0
    sessions_count = sessions.count()
    average_duration = sessions.aggregate(Avg('duration'))['duration__avg'] or 0
    
    # Calculate average ratings
    focus_score = sessions.aggregate(Avg('focus_rating'))['focus_rating__avg'] or 0
    mood_score = sessions.aggregate(Avg('mood_rating'))['mood_rating__avg'] or 0
    
    
    
    # Calculate productivity score
    productivity_score = 0
    if total_study_time > 0:
        productivity_score = ((focus_score + mood_score) * (total_study_time / 60)) / 100
    
    analytics = {
        'period': {
            'start_date': start_date,
            'end_date': end_date
        },
        'metrics': {
            'total_study_time': total_study_time,
            'sessions_count': sessions_count,
            'average_session_duration': round(average_duration, 2),
            'focus_score': round(focus_score, 2),
            'mood_score': round(mood_score, 2),
            'productivity_score': round(productivity_score, 2)
        },
        
    }
    
    return Response(analytics, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_recent_sessions(request):
    """Get recent study sessions."""
    user = request.user
    limit = int(request.query_params.get('limit', 10))
    
    sessions = StudySession.objects.filter(
        user=user,
        is_completed=True
    ).order_by('-started_at')[:limit]
    
    serializer = StudySessionSerializer(sessions, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_active_goals(request):
    """Get active study goals."""
    user = request.user
    
    goals = StudyGoal.objects.filter(
        user=user,
        status='active'
    ).order_by('-created_at')
    
    serializer = StudyGoalSerializer(goals, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_study_insights(request):
    """Get AI-generated study insights."""
    user = request.user
    
    # Get recent sessions for analysis
    recent_sessions = StudySession.objects.filter(
        user=user,
        is_completed=True
    ).order_by('-started_at')[:20]
    
    if not recent_sessions.exists():
        return Response({
            'insights': [],
            'recommendations': []
        }, status=status.HTTP_200_OK)
    
    # Calculate insights (simplified version)
    total_time = sum(session.duration for session in recent_sessions)
    avg_focus = sum(session.focus_rating or 0 for session in recent_sessions) / len(recent_sessions)
    avg_mood = sum(session.mood_rating or 0 for session in recent_sessions) / len(recent_sessions)
    
    insights = [
        f"You've studied for {total_time} minutes in your recent sessions.",
        f"Your average focus rating is {round(avg_focus, 1)}/10.",
        f"Your average mood rating is {round(avg_mood, 1)}/10."
    ]
    
    recommendations = [
        "Try studying in shorter, focused sessions for better retention.",
        "Consider taking breaks every 25 minutes to maintain focus.",
        "Set specific goals for each study session to improve productivity."
    ]
    
    return Response({
        'insights': insights,
        'recommendations': recommendations
    }, status=status.HTTP_200_OK) 