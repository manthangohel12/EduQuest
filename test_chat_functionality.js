const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3001';
const TEST_USER = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'testpass123',
  firstName: 'Test',
  lastName: 'User'
};

// Test results
let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

// Helper function to log test results
function logTest(testName, passed, error = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName} - PASSED`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName} - FAILED`);
    if (error) {
      console.log(`   Error: ${error.message || error}`);
    }
  }
}

// Helper function to make authenticated requests
async function makeAuthRequest(method, endpoint, data = null, token = null) {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
}

// Test 1: Server Health Check
async function testHealthCheck() {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    const passed = response.status === 200 && response.data.status === 'OK';
    logTest('Health Check', passed);
    return passed;
  } catch (error) {
    logTest('Health Check', false, error);
    return false;
  }
}

// Test 2: User Registration
async function testUserRegistration() {
  try {
    const response = await makeAuthRequest('POST', '/api/auth/register', TEST_USER);
    const passed = response.status === 201 && response.data.token;
    logTest('User Registration', passed);
    return response.data.token;
  } catch (error) {
    if (error.response && error.response.status === 400 && error.response.data.message.includes('already exists')) {
      // User already exists, try to login instead
      console.log('   User already exists, attempting login...');
      return await testUserLogin();
    }
    logTest('User Registration', false, error);
    return null;
  }
}

// Test 3: User Login
async function testUserLogin() {
  try {
    const response = await makeAuthRequest('POST', '/api/auth/login', {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    const passed = response.status === 200 && response.data.token;
    logTest('User Login', passed);
    return response.data.token;
  } catch (error) {
    logTest('User Login', false, error);
    return null;
  }
}

// Test 4: Create Chat Session
async function testCreateChatSession(token) {
  try {
    const response = await makeAuthRequest('POST', '/api/chat/sessions', {
      title: 'Test Session',
      description: 'Test chat session',
      sessionType: 'study_partner'
    }, token);
    const passed = response.status === 201 && response.data._id;
    logTest('Create Chat Session', passed);
    return response.data._id;
  } catch (error) {
    logTest('Create Chat Session', false, error);
    return null;
  }
}

// Test 5: Add Message to Session
async function testAddMessage(token, sessionId) {
  try {
    const response = await makeAuthRequest('POST', `/api/chat/sessions/${sessionId}/messages`, {
      content: 'Hello, this is a test message!',
      messageType: 'text',
      isAI: false
    }, token);
    const passed = response.status === 200 && response.data.content;
    logTest('Add Message', passed);
    return passed;
  } catch (error) {
    logTest('Add Message', false, error);
    return false;
  }
}

// Test 6: Get Chat Sessions
async function testGetChatSessions(token) {
  try {
    const response = await makeAuthRequest('GET', '/api/chat/sessions', null, token);
    const passed = response.status === 200 && Array.isArray(response.data);
    logTest('Get Chat Sessions', passed);
    return passed;
  } catch (error) {
    logTest('Get Chat Sessions', false, error);
    return false;
  }
}

// Test 7: Get Chat Statistics
async function testGetChatStatistics(token) {
  try {
    const response = await makeAuthRequest('GET', '/api/chat/statistics', null, token);
    const passed = response.status === 200 && response.data.totalSessions !== undefined;
    logTest('Get Chat Statistics', passed);
    return passed;
  } catch (error) {
    logTest('Get Chat Statistics', false, error);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting EduQuest Chat Functionality Tests...\n');
  
  // Test 1: Health Check
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('\n❌ Server is not running. Please start the Node.js API server first.');
    console.log('   Run: cd eduquest/backend/node_api && npm start');
    return;
  }
  
  // Test 2: User Registration/Login
  const token = await testUserRegistration();
  if (!token) {
    console.log('\n❌ Authentication failed. Cannot continue with other tests.');
    return;
  }
  
  // Test 3: Create Chat Session
  const sessionId = await testCreateChatSession(token);
  if (!sessionId) {
    console.log('\n❌ Failed to create chat session. Cannot continue with message tests.');
    return;
  }
  
  // Test 4: Add Message
  await testAddMessage(token, sessionId);
  
  // Test 5: Get Sessions
  await testGetChatSessions(token);
  
  // Test 6: Get Statistics
  await testGetChatStatistics(token);
  
  // Print summary
  console.log('\n📊 Test Summary:');
  console.log(`   Total Tests: ${testResults.total}`);
  console.log(`   Passed: ${testResults.passed}`);
  console.log(`   Failed: ${testResults.failed}`);
  console.log(`   Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! Chat functionality is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testResults
};



