from django.urls import path
from . import views

app_name = 'courses'

urlpatterns = [
    # Course listing and details
    path('', views.CourseListView.as_view(), name='course-list'),
    path('<int:pk>/', views.CourseDetailView.as_view(), name='course-detail'),
    path('statistics/', views.course_statistics, name='course-statistics'),
    path('recommended/', views.recommended_courses, name='recommended-courses'),
    
    # Course enrollments
    path('enroll/', views.CourseEnrollmentView.as_view(), name='enroll'),
    path('my-enrollments/', views.UserEnrollmentsView.as_view(), name='my-enrollments'),
    path('enrollments/', views.UserEnrollmentsView.as_view(), name='enrollments'),  # Alias for frontend compatibility
    path('enrollment/<int:pk>/', views.EnrollmentDetailView.as_view(), name='enrollment-detail'),
    path('enrollment/<int:enrollment_id>/progress/', views.update_course_progress, name='update-progress'),
    path('enrollment/<int:enrollment_id>/rate/', views.rate_course, name='rate-course'),
] 