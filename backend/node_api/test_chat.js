const axios = require('axios');

async function testStudyChat() {
  // EDITED: Node API runs on 3001 after port swap
  const baseURL = 'http://localhost:3001';
  
  try {
    console.log('🧪 Testing StudyChat AI System...\n');
    
    // Test 1: Health Check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);
    
    // Test 2: Create Chat Session
    console.log('\n2️⃣ Testing chat session creation...');
    const createResponse = await axios.post(`${baseURL}/api/chat/sessions`, {
      subject: 'Mathematics',
      difficulty: 'intermediate'
    });
    const sessionId = createResponse.data.data.sessionId;
    console.log('✅ Session created:', sessionId);
    
    // Test 3: Send Message and Get AI Response
    console.log('\n3️⃣ Testing AI response...');
    const messageResponse = await axios.post(`${baseURL}/api/chat/sessions/${sessionId}/messages`, {
      content: 'Can you explain calculus derivatives?'
    });
    console.log('✅ AI response received:', messageResponse.data.data.aiResponse.content.substring(0, 100) + '...');
    
    // Test 4: Get Session
    console.log('\n4️⃣ Testing session retrieval...');
    const sessionResponse = await axios.get(`${baseURL}/api/chat/sessions/${sessionId}`);
    console.log('✅ Session retrieved with', sessionResponse.data.data.messages.length, 'messages');
    
    // Test 5: Get Study Tips
    console.log('\n5️⃣ Testing study tips...');
    const tipsResponse = await axios.get(`${baseURL}/api/chat/study-tips/math`);
    console.log('✅ Study tips received:', tipsResponse.data.data.tips.length, 'tips');
    
    // Test 6: Get All Sessions
    console.log('\n6️⃣ Testing session listing...');
    const sessionsResponse = await axios.get(`${baseURL}/api/chat/sessions`);
    console.log('✅ Sessions listed:', sessionsResponse.data.data.length, 'sessions');
    
    // Test 7: Delete Session
    console.log('\n7️⃣ Testing session deletion...');
    const deleteResponse = await axios.delete(`${baseURL}/api/chat/sessions/${sessionId}`);
    console.log('✅ Session deleted successfully');
    
    console.log('\n🎉 All tests passed! StudyChat AI is working perfectly!');
    console.log('\n🚀 You can now use the chatbot in your frontend!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure MongoDB is running');
    console.log('2. Check if the server is running on port 3001');
    console.log('3. Verify all dependencies are installed');
  }
}

// Run tests
testStudyChat();

