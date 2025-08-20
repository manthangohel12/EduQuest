from django.urls import path
from . import views

app_name = 'quizzes'

urlpatterns = [
    # Quiz listing and details
    path('', views.QuizListView.as_view(), name='quiz-list'),
    path('<int:pk>/', views.QuizDetailView.as_view(), name='quiz-detail'),
    path('<int:quiz_id>/questions/', views.get_quiz_questions, name='quiz-questions'),
    path('statistics/', views.get_quiz_statistics, name='quiz-statistics'),
    
    # Quiz attempts
    path('attempts/', views.QuizAttemptListView.as_view(), name='attempt-list'),
    path('attempts/<int:pk>/', views.QuizAttemptDetailView.as_view(), name='attempt-detail'),
    path('attempts/<int:attempt_id>/submit-answer/', views.submit_answer, name='submit-answer'),
    path('attempts/<int:attempt_id>/complete/', views.complete_quiz, name='complete-quiz'),
    
    # Quiz generation
    path('generate/', views.generate_quiz, name='generate-quiz'),
    # AI quiz save and attempt submission
    path('ai/save/', views.save_ai_quiz, name='ai-save-quiz'),
    path('ai/attempts/<int:quiz_id>/submit/', views.submit_ai_attempt, name='ai-submit-attempt'),
    
    # User statistics
    path('user-stats/', views.get_user_quiz_stats, name='user-quiz-stats'),
] 