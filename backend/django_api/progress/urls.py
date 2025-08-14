from django.urls import path
from . import views

app_name = 'progress'

urlpatterns = [
    # Progress tracking
    path('', views.ProgressListView.as_view(), name='progress-list'),
    path('<int:pk>/', views.ProgressDetailView.as_view(), name='progress-detail'),
    path('course/<int:course_id>/update/', views.update_course_progress, name='update-course-progress'),
    path('course/<int:course_id>/quiz-score/', views.add_quiz_score, name='add-quiz-score'),
    
    # Learning streaks
    path('streak/', views.LearningStreakView.as_view(), name='learning-streak'),
    path('streak/update/', views.update_streak, name='update-streak'),
    
    # Subject progress
    path('subjects/', views.SubjectProgressListView.as_view(), name='subject-progress-list'),
    path('subjects/<int:pk>/', views.SubjectProgressDetailView.as_view(), name='subject-progress-detail'),
    
    # Analytics and insights
    path('summary/', views.get_progress_summary, name='progress-summary'),
    path('analytics/', views.get_progress_summary, name='progress-analytics'),  # Alias for frontend compatibility
    path('subject-breakdown/', views.get_subject_breakdown, name='subject-breakdown'),
    path('insights/', views.get_learning_insights, name='learning-insights'),
    path('chart-data/', views.get_progress_chart_data, name='progress-chart-data'),
] 