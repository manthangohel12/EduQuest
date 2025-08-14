from django.urls import path
from . import views

app_name = 'study_sessions'

urlpatterns = [
    # Study sessions
    path('', views.StudySessionListView.as_view(), name='session-list'),
    path('<int:pk>/', views.StudySessionDetailView.as_view(), name='session-detail'),
    path('<int:session_id>/end/', views.end_study_session, name='end-session'),
    path('<int:session_id>/progress/', views.update_session_progress, name='update-progress'),
    
    # Study goals
    path('goals/', views.StudyGoalListView.as_view(), name='goal-list'),
    path('goals/<int:pk>/', views.StudyGoalDetailView.as_view(), name='goal-detail'),
    path('goals/<int:goal_id>/progress/', views.update_goal_progress, name='update-goal-progress'),
    
    # Analytics and insights
    path('analytics/', views.get_study_analytics, name='analytics'),
    path('recent/', views.get_recent_sessions, name='recent-sessions'),
    path('active-goals/', views.get_active_goals, name='active-goals'),
    path('insights/', views.get_study_insights, name='insights'),
] 