const axios = require('axios');

const CHAT_SERVICE_URL = 'http://localhost:3001';

async function testChatService() {
  console.log('🔍 Testing EduQuest Chat Service Connection...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await axios.get(`${CHAT_SERVICE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Test 2: Check if chat routes are accessible
    console.log('\n2️⃣ Testing chat endpoints...');
    try {
      const chatResponse = await axios.get(`${CHAT_SERVICE_URL}/api/chat/sessions`);
      console.log('✅ Chat endpoint accessible (requires auth):', chatResponse.status);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Chat endpoint accessible (auth required):', error.response.status);
      } else {
        console.log('❌ Chat endpoint not accessible:', error.message);
      }
    }

    // Test 3: Check auth endpoints
    console.log('\n3️⃣ Testing auth endpoints...');
    try {
      const authResponse = await axios.get(`${CHAT_SERVICE_URL}/api/auth/me`);
      console.log('✅ Auth endpoint accessible (requires auth):', authResponse.status);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Auth endpoint accessible (auth required):', error.response.status);
      } else {
        console.log('❌ Auth endpoint not accessible:', error.message);
      }
    }

    console.log('\n🎉 Chat service is running and accessible!');
    console.log(`📍 Service URL: ${CHAT_SERVICE_URL}`);
    console.log('🔐 Note: Protected endpoints require authentication');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Connection refused - Chat service is not running');
      console.log('💡 Please start the chat service first:');
      console.log('   - Run: debug_chat_service.bat');
      console.log('   - Or: cd eduquest/backend/node_api && npm start');
    } else if (error.code === 'ENOTFOUND') {
      console.log('❌ Host not found - Check if the service URL is correct');
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }
}

// Run the test
testChatService();



