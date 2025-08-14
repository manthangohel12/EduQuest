from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import AIExplanation, ContentAnalysis, ExplanationTemplate, ExplanationHistory, AIProcessingJob
from .serializers import (
    AIExplanationSerializer,
    AIExplanationCreateSerializer,
    AIExplanationUpdateSerializer,
    ContentAnalysisSerializer,
    ExplanationTemplateSerializer,
    ExplanationHistorySerializer,
    AIProcessingJobSerializer,
    AIProcessingJobCreateSerializer,
    ContentSimplificationRequestSerializer,
    ExplanationTemplateRequestSerializer,
    AIExplanationFeedbackSerializer,
    ContentAnalysisRequestSerializer,
    BatchProcessingRequestSerializer
)


class AIExplanationListView(generics.ListCreateAPIView):
    """View for listing and creating AI explanations."""
    serializer_class = AIExplanationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return AIExplanation.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AIExplanationCreateSerializer
        return AIExplanationSerializer
    
    def create(self, request, *args, **kwargs):
        """Override create method to provide better error handling."""
        try:
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                self.perform_create(serializer)
                headers = self.get_success_headers(serializer.data)
                return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            else:
                # Log validation errors for debugging
                print(f"Validation errors: {serializer.errors}")
                return Response(
                    {
                        'error': 'Validation failed',
                        'details': serializer.errors
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            print(f"Error creating AI explanation: {str(e)}")
            return Response(
                {
                    'error': 'Failed to create AI explanation',
                    'details': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def perform_create(self, serializer):
        # This would typically trigger AI processing
        # For now, we'll create a placeholder explanation
        explanation = serializer.save(user=self.request.user)
        explanation.simplified_content = f"Simplified version of: {explanation.original_content[:100]}..."
        explanation.ai_model_used = "local-bert-model"
        explanation.processing_time = 2.5
        explanation.save()


class AIExplanationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View for AI explanation details."""
    serializer_class = AIExplanationUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return AIExplanation.objects.filter(user=self.request.user)


class ExplanationTemplateListView(generics.ListAPIView):
    """View for listing explanation templates."""
    queryset = ExplanationTemplate.objects.filter(is_active=True)
    serializer_class = ExplanationTemplateSerializer
    permission_classes = [permissions.AllowAny]


class ExplanationHistoryListView(generics.ListAPIView):
    """View for listing explanation history."""
    serializer_class = ExplanationHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ExplanationHistory.objects.filter(user=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def simplify_content(request):
    """Simplify content using AI."""
    serializer = ContentSimplificationRequestSerializer(data=request.data)
    if serializer.is_valid():
        data = serializer.validated_data
        
        try:
            # Call AI service for text simplification
            import requests
            import json
            
            ai_service_url = "http://localhost:8001/simplify"
            payload = {
                "text": data['content'],
                "difficulty_level": data['difficulty_level'],
                "target_audience": data.get('target_audience', 'student')
            }
            
            response = requests.post(ai_service_url, json=payload, timeout=60)
            response.raise_for_status()
            ai_result = response.json()
            
            # Create AI explanation with actual AI results
            explanation = AIExplanation.objects.create(
                user=request.user,
                original_content=data['content'],
                content_type=data['content_type'],
                source_url=data.get('source_url', ''),
                difficulty_level=data['difficulty_level'],
                simplified_content=ai_result['simplified_text'],
                summary=ai_result.get('summary', ai_result['simplified_text']),
                ai_model_used="mistral-7b-instruct",
                processing_time=3.2
            )
            
            # Add AI-generated features
            if ai_result.get('key_concepts'):
                explanation.key_concepts = ai_result['key_concepts']
            
            if ai_result.get('explanations'):
                explanation.examples = ai_result['explanations']
            
            # Add summary if available
            if ai_result.get('summary'):
                explanation.summary = ai_result['summary']
            
            explanation.save()
            
            # Create content analysis with actual metrics
            analysis = ContentAnalysis.objects.create(
                explanation=explanation,
                readability_score=ai_result.get('original_complexity', 75.5),
                complexity_score=1.0 - (ai_result.get('simplified_complexity', 75.5) / 100.0),
                word_count=len(data['content'].split()),
                sentence_count=len(data['content'].split('.')),
                topics=ai_result.get('key_concepts', [])[:5],
                entities=[],
                keywords=ai_result.get('key_concepts', [])[:10]
            )
            
            return Response({
                'message': 'Content simplified successfully.',
                'explanation_id': explanation.id,
                'processing_time': explanation.processing_time,
                'ai_result': ai_result
            }, status=status.HTTP_201_CREATED)
            
        except requests.RequestException as e:
            # Fallback to basic processing if AI service is unavailable
            explanation = AIExplanation.objects.create(
                user=request.user,
                original_content=data['content'],
                content_type=data['content_type'],
                source_url=data.get('source_url', ''),
                difficulty_level=data['difficulty_level'],
                simplified_content=f"AI-simplified version of the content at {data['difficulty_level']} level.",
                ai_model_used="fallback-model",
                processing_time=2.0
            )
            
            explanation.save()
            
            return Response({
                'message': 'Content processed with fallback method.',
                'explanation_id': explanation.id,
                'processing_time': explanation.processing_time,
                'note': 'AI service unavailable, using fallback processing'
            }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def use_explanation_template(request):
    """Use an explanation template to generate content."""
    serializer = ExplanationTemplateRequestSerializer(data=request.data)
    if serializer.is_valid():
        data = serializer.validated_data
        
        # Get template
        if data.get('template_id'):
            template = get_object_or_404(ExplanationTemplate, id=data['template_id'])
        else:
            template = ExplanationTemplate.objects.filter(
                template_type=data.get('template_type', 'concept'),
                is_active=True
            ).first()
        
        if not template:
            return Response(
                {'error': 'No suitable template found.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create explanation using template
        explanation = AIExplanation.objects.create(
            user=request.user,
            original_content=data['content'],
            content_type='template_generated',
            simplified_content=f"Generated using template: {template.name}",
            difficulty_level=data['difficulty_level'],
            ai_model_used="template-based-generation",
            processing_time=1.8
        )
        
        # Update template usage
        template.increment_usage()
        
        # Create history record
        ExplanationHistory.objects.create(
            user=request.user,
            template=template,
            original_content=data['content'],
            requested_difficulty=data['difficulty_level'],
            content_type='template_generated',
            simplified_content=explanation.simplified_content,
            processing_time=explanation.processing_time,
            ai_model_used=explanation.ai_model_used
        )
        
        return Response({
            'message': 'Content generated using template successfully.',
            'explanation_id': explanation.id,
            'template_used': template.name
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_explanation_feedback(request, explanation_id):
    """Add feedback to an AI explanation."""
    explanation = get_object_or_404(AIExplanation, id=explanation_id, user=request.user)
    
    serializer = AIExplanationFeedbackSerializer(data=request.data)
    if serializer.is_valid():
        rating = serializer.validated_data['rating']
        feedback = serializer.validated_data.get('feedback', '')
        
        explanation.add_rating(rating, feedback)
        
        return Response({
            'message': 'Feedback added successfully.',
            'rating': rating,
            'feedback': feedback
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_favorite(request, explanation_id):
    """Toggle favorite status of an explanation."""
    explanation = get_object_or_404(AIExplanation, id=explanation_id, user=request.user)
    
    explanation.toggle_favorite()
    
    return Response({
        'message': f"Explanation {'added to' if explanation.is_favorite else 'removed from'} favorites.",
        'is_favorite': explanation.is_favorite
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def analyze_content(request):
    """Analyze content for insights."""
    serializer = ContentAnalysisRequestSerializer(data=request.data)
    if serializer.is_valid():
        data = serializer.validated_data
        
        # Create content analysis (simplified version)
        analysis = ContentAnalysis.objects.create(
            explanation=None,  # Will be linked later if needed
            readability_score=70.0,
            complexity_score=0.4,
            word_count=len(data['content'].split()),
            sentence_count=len(data['content'].split('.')),
            language_detected='en',
            sentiment_score=0.2,
            topics=['topic1', 'topic2'] if data.get('include_topics', True) else [],
            entities=['entity1', 'entity2'] if data.get('include_entities', True) else [],
            keywords=['keyword1', 'keyword2'] if data.get('include_keywords', True) else [],
            learning_objectives=['objective1', 'objective2'],
            prerequisite_knowledge=['prerequisite1', 'prerequisite2']
        )
        
        return Response({
            'message': 'Content analyzed successfully.',
            'analysis_id': analysis.id,
            'readability_score': analysis.readability_score,
            'complexity_score': analysis.complexity_score,
            'topics': analysis.topics,
            'entities': analysis.entities,
            'keywords': analysis.keywords
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def batch_process_content(request):
    """Process multiple content items in batch."""
    serializer = BatchProcessingRequestSerializer(data=request.data)
    if serializer.is_valid():
        data = serializer.validated_data
        
        # Create batch processing job
        job = AIProcessingJob.objects.create(
            user=request.user,
            job_type='batch_simplification',
            input_data={
                'contents': data['contents'],
                'difficulty_level': data['difficulty_level'],
                'content_type': data['content_type']
            }
        )
        
        # Simulate processing
        job.start_processing()
        
        # Create explanations for each content item
        explanations = []
        for i, content in enumerate(data['contents']):
            explanation = AIExplanation.objects.create(
                user=request.user,
                original_content=content,
                content_type=data['content_type'],
                simplified_content=f"Batch processed content {i+1}",
                difficulty_level=data['difficulty_level'],
                ai_model_used="batch-bert-model",
                processing_time=1.5
            )
            explanations.append(explanation.id)
        
        # Complete job
        job.complete_job({
            'explanation_ids': explanations,
            'total_processed': len(data['contents'])
        }, processing_time=len(data['contents']) * 1.5)
        
        return Response({
            'message': 'Batch processing completed successfully.',
            'job_id': job.id,
            'total_processed': len(data['contents']),
            'explanation_ids': explanations
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_processing_job_status(request, job_id):
    """Get status of an AI processing job."""
    job = get_object_or_404(AIProcessingJob, id=job_id, user=request.user)
    
    serializer = AIProcessingJobSerializer(job)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_favorites(request):
    """Get user's favorite explanations."""
    favorites = AIExplanation.objects.filter(user=request.user, is_favorite=True)
    
    serializer = AIExplanationSerializer(favorites, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_explanation_statistics(request):
    """Get statistics about user's explanations."""
    user = request.user
    
    total_explanations = AIExplanation.objects.filter(user=user).count()
    favorite_count = AIExplanation.objects.filter(user=user, is_favorite=True).count()
    average_rating = AIExplanation.objects.filter(
        user=user, rating__isnull=False
    ).aggregate(avg_rating=models.Avg('rating'))['avg_rating'] or 0
    
    # Get most used difficulty levels
    difficulty_stats = AIExplanation.objects.filter(user=user).values(
        'difficulty_level'
    ).annotate(count=models.Count('id'))
    
    statistics = {
        'total_explanations': total_explanations,
        'favorite_count': favorite_count,
        'average_rating': round(average_rating, 2),
        'difficulty_breakdown': list(difficulty_stats)
    }
    
    return Response(statistics, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def process_file_content(request):
    """Process uploaded file and simplify content using AI."""
    try:
        # Get uploaded file
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response(
                {'error': 'No file uploaded.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get parameters
        difficulty_level = request.data.get('difficulty_level', 'intermediate')
        target_audience = request.data.get('target_audience', 'student')
        
        try:
            # Call AI service for file processing
            import requests
            
            ai_service_url = "http://localhost:8001/process-file"
            
            # Prepare file data
            files = {
                'file_content': (uploaded_file.name, uploaded_file.read(), uploaded_file.content_type)
            }
            data = {
                'filename': uploaded_file.name,
                'difficulty_level': difficulty_level,
                'target_audience': target_audience
            }
            
            response = requests.post(ai_service_url, files=files, data=data, timeout=120)
            response.raise_for_status()
            ai_result = response.json()
            
            # Create AI explanation with file processing results
            explanation = AIExplanation.objects.create(
                user=request.user,
                original_content=ai_result.get('original_text', ''),
                content_type=f"file_{uploaded_file.name.split('.')[-1]}",
                source_url=f"uploaded_file:{uploaded_file.name}",
                difficulty_level=difficulty_level,
                simplified_content=ai_result['simplified_text'],
                ai_model_used="mistral-7b-instruct",
                processing_time=5.0
            )
            
            # Add AI-generated features
            if ai_result.get('key_concepts'):
                explanation.key_concepts = ai_result['key_concepts']
            
            if ai_result.get('explanations'):
                explanation.examples = ai_result['explanations']
            
            if ai_result.get('summary'):
                explanation.summary = ai_result['summary']
            
            explanation.save()
            
            # Create content analysis
            analysis = ContentAnalysis.objects.create(
                explanation=explanation,
                readability_score=ai_result.get('original_complexity', 75.5),
                complexity_score=1.0 - (ai_result.get('simplified_complexity', 75.5) / 100.0),
                word_count=ai_result.get('file_metadata', {}).get('word_count', 0),
                sentence_count=ai_result.get('file_metadata', {}).get('sentence_count', 0),
                topics=ai_result.get('key_concepts', [])[:5],
                entities=[],
                keywords=ai_result.get('key_concepts', [])[:10]
            )
            
            return Response({
                'message': 'File processed and simplified successfully.',
                'explanation_id': explanation.id,
                'processing_time': explanation.processing_time,
                'ai_result': ai_result,
                'file_info': {
                    'name': uploaded_file.name,
                    'size': uploaded_file.size,
                    'type': uploaded_file.content_type
                }
            }, status=status.HTTP_201_CREATED)
            
        except requests.RequestException as e:
            return Response(
                {'error': f'AI service unavailable: {str(e)}'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
            
    except Exception as e:
        return Response(
            {'error': f'File processing failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_supported_file_formats(request):
    """Get list of supported file formats."""
    try:
        import requests
        
        ai_service_url = "http://localhost:8001/supported-formats"
        response = requests.get(ai_service_url, timeout=10)
        response.raise_for_status()
        
        return Response(response.json())
        
    except requests.RequestException:
        # Fallback formats if AI service is unavailable
        return Response({
            'supported_formats': ['.txt', '.pdf', '.docx', '.doc', '.rtf', '.md', '.html', '.htm']
        }) 