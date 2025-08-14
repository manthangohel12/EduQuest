from django.urls import path
from . import views

app_name = 'ai_explanations'

urlpatterns = [
    # AI explanations
    path('', views.AIExplanationListView.as_view(), name='explanation-list'),
    path('<int:pk>/', views.AIExplanationDetailView.as_view(), name='explanation-detail'),
    path('<int:explanation_id>/feedback/', views.add_explanation_feedback, name='add-feedback'),
    path('<int:explanation_id>/favorite/', views.toggle_favorite, name='toggle-favorite'),
    
    # Content processing
    path('simplify/', views.simplify_content, name='simplify-content'),
    path('analyze/', views.analyze_content, name='analyze-content'),
    path('batch-process/', views.batch_process_content, name='batch-process'),
    path('use-template/', views.use_explanation_template, name='use-template'),
    
    # Templates and history
    path('templates/', views.ExplanationTemplateListView.as_view(), name='template-list'),
    path('history/', views.ExplanationHistoryListView.as_view(), name='history-list'),
    
    # Processing jobs
    path('jobs/<int:job_id>/status/', views.get_processing_job_status, name='job-status'),
    
    # User data
    path('favorites/', views.get_user_favorites, name='user-favorites'),
    path('statistics/', views.get_explanation_statistics, name='explanation-statistics'),
    
    # File processing
    path('process-file/', views.process_file_content, name='process-file'),
    path('supported-formats/', views.get_supported_file_formats, name='supported-formats'),
] 