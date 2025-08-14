from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    # Authentication
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    
    # Profile management
    path('me/', views.UserProfileView.as_view(), name='me'),
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('stats/', views.UserStatsView.as_view(), name='stats'),
    path('preferences/', views.UserPreferencesView.as_view(), name='preferences'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    
    # Gamification
    path('add-experience/', views.add_experience, name='add-experience'),
    path('add-badge/', views.add_badge, name='add-badge'),
    path('update-study-session/', views.update_study_session, name='update-study-session'),
    path('study-stats/', views.get_study_stats, name='study-stats'),
] 