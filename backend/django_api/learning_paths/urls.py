from django.urls import path
from . import views

app_name = 'learning_paths'

urlpatterns = [
    # Learning paths
    path('', views.LearningPathListView.as_view(), name='learning-path-list'),
    path('<int:pk>/', views.LearningPathDetailView.as_view(), name='learning-path-detail'),
    path('generate/', views.generate_learning_path, name='generate-learning-path'),
    path('<int:learning_path_id>/stats/', views.get_learning_path_stats, name='learning-path-stats'),
    
    # Learning path steps
    path('<int:learning_path_id>/steps/', views.LearningPathStepListView.as_view(), name='step-list'),
    path('step/<int:pk>/', views.LearningPathStepDetailView.as_view(), name='step-detail'),
    path('step/<int:step_id>/complete/', views.complete_step, name='complete-step'),
    path('step/<int:step_id>/progress/', views.add_progress_record, name='add-progress'),
    path('step/<int:step_id>/progress-records/', views.get_step_progress, name='step-progress'),
] 