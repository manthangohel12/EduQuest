from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .serializers import (
    UserRegistrationSerializer,
    UserProfileSerializer,
    UserStatsSerializer,
    UserPreferencesSerializer,
    ChangePasswordSerializer
)

User = get_user_model()


class UserRegistrationView(generics.CreateAPIView):
    """View for user registration."""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class UserProfileView(generics.RetrieveUpdateAPIView):
    """View for user profile management."""
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class UserStatsView(generics.RetrieveAPIView):
    """View for user statistics."""
    serializer_class = UserStatsSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class UserPreferencesView(generics.RetrieveUpdateAPIView):
    """View for user learning preferences."""
    serializer_class = UserPreferencesSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """View for changing user password."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'message': 'Password changed successfully.'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_experience(request):
    """Add experience points to user."""
    points = request.data.get('points', 0)
    if points <= 0:
        return Response({'error': 'Points must be positive.'}, status=status.HTTP_400_BAD_REQUEST)
    
    user = request.user
    user.add_experience(points)
    
    return Response({
        'message': f'Added {points} experience points.',
        'new_experience': user.experience_points,
        'new_level': user.level
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_badge(request):
    """Add a badge to user."""
    badge_name = request.data.get('badge_name')
    if not badge_name:
        return Response({'error': 'Badge name is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    user = request.user
    user.add_badge(badge_name)
    
    return Response({
        'message': f'Badge "{badge_name}" added successfully.',
        'badges': user.badges
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_study_session(request):
    """Update user study session and streak."""
    study_time = request.data.get('study_time', 0)  # in minutes
    
    user = request.user
    user.total_study_time += study_time
    user.update_streak()
    
    # Add experience points based on study time
    experience_gained = study_time // 10  # 1 XP per 10 minutes
    if experience_gained > 0:
        user.add_experience(experience_gained)
    
    return Response({
        'message': 'Study session updated successfully.',
        'total_study_time': user.total_study_time,
        'current_streak': user.current_streak,
        'experience_gained': experience_gained,
        'total_experience': user.experience_points
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_study_stats(request):
    """Get comprehensive study statistics."""
    user = request.user
    stats = user.get_study_stats()
    
    return Response(stats, status=status.HTTP_200_OK) 