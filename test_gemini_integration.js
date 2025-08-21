// Test script for Gemini AI integration
// This tests the AI services endpoint that StudyChat now uses

async function testGeminiIntegration() {
  console.log('🧪 Testing Gemini AI Integration...\n');

  const testQuestions = [
    "Can you explain quantum physics?",
    "What is calculus?",
    "How do I solve quadratic equations?",
    "Tell me about ancient civilizations",
    "How does photosynthesis work?",
    "What is the Renaissance?",
    "Explain atoms and molecules",
    "What is machine learning?",
    "How do I study effectively?",
    "What is the weather like today?" // This should be rejected as non-study related
  ];

  for (let i = 0; i < testQuestions.length; i++) {
    const question = testQuestions[i];
    console.log(`Question ${i + 1}: ${question}`);
    
    try {
      const response = await fetch('http://localhost:8000/api/ai-services/study-chat/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          context: 'General Study'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Response: ${data.answer.substring(0, 100)}...`);
        console.log(`📚 Study Related: ${data.is_study_related}`);
        console.log(`🤖 Model: ${data.model || 'Unknown'}`);
      } else {
        console.log(`❌ Error: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Connection Error: ${error.message}`);
    }
    
    console.log('---');
    
    // Wait a bit between requests to avoid overwhelming the service
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('✅ Gemini AI Integration Test Complete!');
  console.log('If you see responses above, the Gemini integration is working!');
  console.log('If you see connection errors, make sure the AI services are running on port 8000.');
}

// Run the test
testGeminiIntegration().catch(console.error);
