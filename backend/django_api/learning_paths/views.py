from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import LearningPath, LearningPathStep, LearningPathProgress
from .serializers import (
    LearningPathSerializer,
    LearningPathDetailSerializer,
    LearningPathCreateSerializer,
    LearningPathStepSerializer,
    LearningPathStepUpdateSerializer,
    LearningPathProgressSerializer,
    LearningPathProgressCreateSerializer,
    LearningPathRecommendationSerializer
)


class LearningPathListView(generics.ListCreateAPIView):
    """View for listing and creating learning paths."""
    serializer_class = LearningPathSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return LearningPath.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class LearningPathDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View for learning path details."""
    serializer_class = LearningPathDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return LearningPath.objects.filter(user=self.request.user)


class LearningPathStepListView(generics.ListAPIView):
    """View for listing steps in a learning path."""
    serializer_class = LearningPathStepSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        learning_path_id = self.kwargs.get('learning_path_id')
        learning_path = get_object_or_404(LearningPath, id=learning_path_id, user=self.request.user)
        return LearningPathStep.objects.filter(learning_path=learning_path)


class LearningPathStepDetailView(generics.RetrieveUpdateAPIView):
    """View for learning path step details."""
    serializer_class = LearningPathStepUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return LearningPathStep.objects.filter(learning_path__user=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def complete_step(request, step_id):
    """Mark a learning path step as completed."""
    step = get_object_or_404(LearningPathStep, id=step_id, learning_path__user=request.user)
    
    if step.is_completed:
        return Response(
            {'error': 'Step is already completed.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not step.can_start():
        return Response(
            {'error': 'Prerequisites not met for this step.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    step.mark_completed()
    
    # Update user stats
    user = request.user
    user.total_study_time += step.estimated_duration
    user.update_streak()
    
    # Add experience points
    experience_gained = step.estimated_duration // 10
    if experience_gained > 0:
        user.add_experience(experience_gained)
    
    return Response({
        'message': 'Step completed successfully.',
        'step_id': step.id,
        'experience_gained': experience_gained
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_progress_record(request, step_id):
    """Add a progress record for a learning path step."""
    step = get_object_or_404(LearningPathStep, id=step_id, learning_path__user=request.user)
    
    serializer = LearningPathProgressCreateSerializer(data=request.data)
    if serializer.is_valid():
        progress_record = serializer.save(step=step)
        
        # Update user stats
        user = request.user
        user.total_study_time += progress_record.session_duration
        user.update_streak()
        
        # Add experience points
        experience_gained = progress_record.session_duration // 10
        if experience_gained > 0:
            user.add_experience(experience_gained)
        
        return Response({
            'message': 'Progress record added successfully.',
            'progress_id': progress_record.id,
            'experience_gained': experience_gained
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_step_progress(request, step_id):
    """Get progress records for a specific step."""
    step = get_object_or_404(LearningPathStep, id=step_id, learning_path__user=request.user)
    progress_records = LearningPathProgress.objects.filter(step=step)
    
    serializer = LearningPathProgressSerializer(progress_records, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_learning_path(request):
    """Generate a personalized learning path based on user preferences."""
    serializer = LearningPathRecommendationSerializer(data=request.data)
    if serializer.is_valid():
        user = request.user
        data = serializer.validated_data
        
        # Create learning path with AI recommendations
        # This is a simplified version - in production, you'd integrate with AI services
        ai_recommendations = [
            {
                'course_id': 1,
                'reason': 'Matches your learning style and difficulty preference',
                'estimated_time': 120
            },
            {
                'course_id': 2,
                'reason': 'Builds on previous knowledge',
                'estimated_time': 90
            }
        ]
        
        learning_path = LearningPath.objects.create(
            user=user,
            title=f"Personalized {data['subject']} Learning Path",
            description=f"AI-generated learning path for {data['subject']} at {data['difficulty']} level",
            subject=data['subject'],
            difficulty=data['difficulty'],
            estimated_duration=data.get('time_available', 10),
            ai_recommendations=ai_recommendations,
            user_preferences=data
        )
        
        # Create steps based on recommendations
        for i, recommendation in enumerate(ai_recommendations):
            LearningPathStep.objects.create(
                learning_path=learning_path,
                title=f"Step {i + 1}: Course {recommendation['course_id']}",
                description=recommendation['reason'],
                step_type='course',
                order=i,
                estimated_duration=recommendation['estimated_time']
            )
        
        return Response({
            'message': 'Learning path generated successfully.',
            'learning_path_id': learning_path.id
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_learning_path_stats(request, learning_path_id):
    """Get statistics for a learning path."""
    learning_path = get_object_or_404(LearningPath, id=learning_path_id, user=request.user)
    
    total_steps = learning_path.steps.count()
    completed_steps = learning_path.steps.filter(is_completed=True).count()
    total_time_spent = sum(
        record.time_spent for record in learning_path.progress_records.all()
    )
    
    stats = {
        'total_steps': total_steps,
        'completed_steps': completed_steps,
        'progress_percentage': learning_path.progress_percentage,
        'total_time_spent': total_time_spent,
        'status': learning_path.status,
        'current_step': learning_path.current_step
    }
    
    return Response(stats, status=status.HTTP_200_OK) 