from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name',
            'password', 'password_confirm', 'learning_style',
            'difficulty_preference'
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        # Since USERNAME_FIELD is 'email', we need to pass email as username
        validated_data['username'] = validated_data['email']
        user = User.objects.create_user(**validated_data)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile data."""
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'bio', 'avatar', 'learning_style', 'difficulty_preference',
            'total_study_time', 'total_courses_completed',
            'current_streak', 'longest_streak', 'experience_points',
            'level', 'badges', 'notifications_enabled', 'email_notifications',
            'study_reminders', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'total_study_time', 'total_courses_completed',
            'current_streak', 'longest_streak', 'experience_points',
            'level', 'badges', 'created_at', 'updated_at'
        ]


class UserStatsSerializer(serializers.ModelSerializer):
    """Serializer for user statistics."""
    
    class Meta:
        model = User
        fields = [
            'total_study_time', 'total_courses_completed', 'current_streak',
            'longest_streak', 'experience_points', 'level', 'badges'
        ]


class UserPreferencesSerializer(serializers.ModelSerializer):
    """Serializer for user learning preferences."""
    
    class Meta:
        model = User
        fields = [
            'learning_style', 'difficulty_preference',
            'notifications_enabled', 'email_notifications', 'study_reminders'
        ]


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password."""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match.")
        return attrs
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value 