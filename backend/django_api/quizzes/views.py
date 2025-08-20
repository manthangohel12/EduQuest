from rest_framework import status, generics, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from rest_framework.parsers import JSONParser
from progress.models import Progress
from .models import Quiz, QuizQuestion, QuizAttempt, QuizAnswer
from .serializers import (
    QuizSerializer,
    QuizDetailSerializer,
    QuizAttemptSerializer,
    QuizAttemptCreateSerializer,
    QuizAnswerSerializer,
    QuizAnswerCreateSerializer,
    QuizGenerationSerializer,
    QuizSearchSerializer,
    QuizResultSerializer
)


class QuizListView(generics.ListAPIView):
    """View for listing all quizzes with filtering."""
    queryset = Quiz.objects.filter(is_active=True)
    serializer_class = QuizSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'subject']
    ordering_fields = ['created_at', 'average_score', 'total_attempts']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by subject
        subject = self.request.query_params.get('subject')
        if subject:
            queryset = queryset.filter(subject=subject)
        
        # Filter by difficulty
        difficulty = self.request.query_params.get('difficulty')
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        
        # Filter by quiz type
        quiz_type = self.request.query_params.get('quiz_type')
        if quiz_type:
            queryset = queryset.filter(quiz_type=quiz_type)
        
        # Filter by featured quizzes
        featured = self.request.query_params.get('featured')
        if featured and featured.lower() == 'true':
            queryset = queryset.filter(is_featured=True)
        
        # Filter by AI-generated quizzes
        ai_generated = self.request.query_params.get('ai_generated')
        if ai_generated and ai_generated.lower() == 'true':
            queryset = queryset.filter(is_ai_generated=True)
        
        return queryset


class QuizDetailView(generics.RetrieveAPIView):
    """View for detailed quiz information."""
    queryset = Quiz.objects.filter(is_active=True)
    serializer_class = QuizDetailSerializer
    permission_classes = [permissions.AllowAny]


class QuizAttemptListView(generics.ListCreateAPIView):
    """View for listing and creating quiz attempts."""
    serializer_class = QuizAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return QuizAttempt.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return QuizAttemptCreateSerializer
        return QuizAttemptSerializer
    
    def perform_create(self, serializer):
        quiz = get_object_or_404(Quiz, id=serializer.validated_data['quiz'].id, is_active=True)
        serializer.save(user=self.request.user)


class QuizAttemptDetailView(generics.RetrieveAPIView):
    """View for quiz attempt details."""
    serializer_class = QuizResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return QuizAttempt.objects.filter(user=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_answer(request, attempt_id):
    """Submit an answer for a quiz question."""
    attempt = get_object_or_404(QuizAttempt, id=attempt_id, user=request.user)
    
    if attempt.status != 'in_progress':
        return Response(
            {'error': 'Cannot submit answers for completed quiz.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = QuizAnswerCreateSerializer(data=request.data)
    if serializer.is_valid():
        question = get_object_or_404(QuizQuestion, id=serializer.validated_data['question'].id)
        
        # Check if answer already exists
        answer, created = QuizAnswer.objects.get_or_create(
            attempt=attempt,
            question=question,
            defaults={
                'user_answer': serializer.validated_data['user_answer'],
                'time_spent': serializer.validated_data.get('time_spent', 0)
            }
        )
        
        if not created:
            # Update existing answer
            answer.user_answer = serializer.validated_data['user_answer']
            answer.time_spent = serializer.validated_data.get('time_spent', answer.time_spent)
            answer.save()
        
        # Check if answer is correct
        answer.check_answer()
        
        return Response({
            'message': 'Answer submitted successfully.',
            'is_correct': answer.is_correct,
            'points_earned': answer.points_earned
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def complete_quiz(request, attempt_id):
    """Complete a quiz attempt."""
    attempt = get_object_or_404(QuizAttempt, id=attempt_id, user=request.user)
    
    if attempt.status != 'in_progress':
        return Response(
            {'error': 'Quiz is already completed.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    time_taken = request.data.get('time_taken', 0)
    attempt.complete_attempt(time_taken)
    
    return Response({
        'message': 'Quiz completed successfully.',
        'score': attempt.score,
        'passed': attempt.passed,
        'total_questions': attempt.total_questions,
        'correct_answers': attempt.correct_answers
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_quiz_questions(request, quiz_id):
    """Get questions for a specific quiz."""
    quiz = get_object_or_404(Quiz, id=quiz_id, is_active=True)
    questions = QuizQuestion.objects.filter(quiz=quiz).order_by('order')
    
    serializer = QuizQuestionSerializer(questions, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_quiz(request):
    """Generate a quiz using AI."""
    serializer = QuizGenerationSerializer(data=request.data)
    if serializer.is_valid():
        data = serializer.validated_data
        
        # Create quiz with AI-generated content
        # This is a simplified version - in production, you'd integrate with AI services
        quiz = Quiz.objects.create(
            title=f"AI Generated {data['subject']} Quiz",
            description=f"AI-generated quiz for {data['subject']} at {data['difficulty']} level",
            subject=data['subject'],
            difficulty=data['difficulty'],
            quiz_type=data['quiz_type'],
            time_limit=data.get('time_limit', 30),
            passing_score=data.get('passing_score', 70),
            is_ai_generated=True,
            source_content=data.get('source_content', ''),
            ai_prompt=f"Generate {data['num_questions']} {data['quiz_type']} questions for {data['subject']} at {data['difficulty']} level"
        )
        
        # Create sample questions (in production, these would be AI-generated)
        sample_questions = [
            {
                'question_text': f"Sample question 1 for {data['subject']}",
                'question_type': data['quiz_type'],
                'options': ['Option A', 'Option B', 'Option C', 'Option D'],
                'correct_answer': 'Option A',
                'points': 1,
                'difficulty_level': data['difficulty'],
                'explanation': 'This is the correct answer because...',
                'order': 1
            },
            {
                'question_text': f"Sample question 2 for {data['subject']}",
                'question_type': data['quiz_type'],
                'options': ['Option A', 'Option B', 'Option C', 'Option D'],
                'correct_answer': 'Option B',
                'points': 1,
                'difficulty_level': data['difficulty'],
                'explanation': 'This is the correct answer because...',
                'order': 2
            }
        ]
        
        for question_data in sample_questions:
            QuizQuestion.objects.create(quiz=quiz, **question_data)
        
        quiz.total_questions = quiz.questions.count()
        quiz.save()
        
        return Response({
            'message': 'Quiz generated successfully.',
            'quiz_id': quiz.id,
            'total_questions': quiz.total_questions
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def save_ai_quiz(request):
    """Save an AI-generated quiz along with source content and questions.
    Expected payload:
    {
      "title": str,
      "description": str,
      "subject": str,
      "difficulty": "easy|medium|hard",
      "quiz_type": "multiple_choice|true_false|fill_blank",
      "source_content": str,
      "questions": [
         {"question": str, "options": list, "correct_answer": str|bool, "explanation": str, "type": str}
      ],
      "course_id": int (optional, for progress aggregation)
    }
    """
    data = request.data
    try:
        quiz = Quiz.objects.create(
            title=data.get('title') or 'AI Generated Quiz',
            description=data.get('description') or 'Quiz generated by AI services',
            subject=data.get('subject') or 'General',
            difficulty=data.get('difficulty') or 'medium',
            quiz_type=data.get('quiz_type') or 'multiple_choice',
            is_ai_generated=True,
            source_content=data.get('source_content') or '',
            ai_prompt=data.get('ai_prompt') or ''
        )

        questions = data.get('questions', [])
        order = 1
        created_question_ids = []
        for q in questions:
            created = QuizQuestion.objects.create(
                quiz=quiz,
                question_text=q.get('question', ''),
                question_type=q.get('type', 'multiple_choice'),
                options=q.get('options') or [],
                correct_answer=str(q.get('correct_answer')) if q.get('correct_answer') is not None else '',
                points=1,
                difficulty_level=data.get('difficulty') or 'medium',
                explanation=q.get('explanation', ''),
                order=order
            )
            created_question_ids.append(created.id)
            order += 1

        quiz.total_questions = quiz.questions.count()
        quiz.save()

        # Optionally create a progress record anchor if course_id provided
        course_id = data.get('course_id')
        if course_id:
            try:
                progress, _ = Progress.objects.get_or_create(user=request.user, course_id=course_id)
                progress.save()
            except Exception:
                pass

        return Response({
            'message': 'AI quiz saved successfully.',
            'quiz_id': quiz.id,
            'total_questions': quiz.total_questions,
            'question_ids': created_question_ids
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_ai_attempt(request, quiz_id):
    """Submit an AI quiz attempt with answers and return detailed results including explanations.
    Expected payload:
    {
      "answers": [{"question_id": int, "user_answer": str}],
      "time_taken": int,
      "course_id": int (optional)
    }
    """
    quiz = get_object_or_404(Quiz, id=quiz_id, is_active=True)

    answers_payload = request.data.get('answers', [])
    time_taken = int(request.data.get('time_taken', 0))
    course_id = request.data.get('course_id')

    # Create attempt
    attempt = QuizAttempt.objects.create(
        user=request.user,
        quiz=quiz,
        status='in_progress',
        total_questions=quiz.questions.count()
    )

    correct_count = 0
    total_points = 0
    detailed_results = []

    for item in answers_payload:
        q = get_object_or_404(QuizQuestion, id=item.get('question_id'), quiz=quiz)
        user_answer = str(item.get('user_answer'))
        is_correct = q.check_answer(user_answer)
        points_earned = q.points if is_correct else 0
        total_points += points_earned
        if is_correct:
            correct_count += 1

        QuizAnswer.objects.create(
            attempt=attempt,
            question=q,
            user_answer=user_answer,
            is_correct=is_correct,
            points_earned=points_earned,
            time_spent=0
        )

        detailed_results.append({
            'question_id': q.id,
            'question': q.question_text,
            'user_answer': user_answer,
            'correct_answer': q.correct_answer,
            'is_correct': is_correct,
            'explanation': q.explanation,
            'reference_text': quiz.source_content
        })

    attempt.correct_answers = correct_count
    attempt.total_points = total_points
    attempt.status = 'completed'
    attempt.completed_at = timezone.now()
    attempt.time_taken = time_taken
    attempt.calculate_score()

    # Update quiz statistics
    quiz.total_attempts += 1
    # Recompute average score
    from django.db.models import Avg
    quiz.average_score = QuizAttempt.objects.filter(quiz=quiz, status='completed').aggregate(Avg('score'))['score__avg'] or attempt.score
    quiz.save()

    # Update user progress if course_id provided
    if course_id:
        try:
            progress, _ = Progress.objects.get_or_create(user=request.user, course_id=course_id)
            progress.add_quiz_score(attempt.score)
        except Exception:
            pass

    return Response({
        'message': 'Attempt submitted successfully.',
        'attempt_id': attempt.id,
        'score': attempt.score,
        'total_questions': attempt.total_questions,
        'correct_answers': attempt.correct_answers,
        'results': detailed_results
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_quiz_stats(request):
    """Get user's quiz statistics."""
    user = request.user
    
    total_attempts = QuizAttempt.objects.filter(user=user).count()
    completed_attempts = QuizAttempt.objects.filter(user=user, status='completed').count()
    passed_attempts = QuizAttempt.objects.filter(user=user, passed=True).count()
    
    if completed_attempts > 0:
        average_score = QuizAttempt.objects.filter(
            user=user, status='completed'
        ).aggregate(avg_score=models.Avg('score'))['avg_score'] or 0
        pass_rate = (passed_attempts / completed_attempts) * 100
    else:
        average_score = 0
        pass_rate = 0
    
    stats = {
        'total_attempts': total_attempts,
        'completed_attempts': completed_attempts,
        'passed_attempts': passed_attempts,
        'average_score': round(average_score, 2),
        'pass_rate': round(pass_rate, 2)
    }
    
    return Response(stats, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_quiz_statistics(request):
    """Get overall quiz statistics."""
    total_quizzes = Quiz.objects.filter(is_active=True).count()
    total_attempts = QuizAttempt.objects.count()
    completed_attempts = QuizAttempt.objects.filter(status='completed').count()
    
    if completed_attempts > 0:
        average_score = QuizAttempt.objects.filter(
            status='completed'
        ).aggregate(avg_score=models.Avg('score'))['avg_score'] or 0
    else:
        average_score = 0
    
    stats = {
        'total_quizzes': total_quizzes,
        'total_attempts': total_attempts,
        'completed_attempts': completed_attempts,
        'average_score': round(average_score, 2)
    }
    
    return Response(stats, status=status.HTTP_200_OK) 