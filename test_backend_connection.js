const axios = require('axios');

// Test backend connectivity
async function testBackendServices() {
  console.log('🔍 Testing EduQuest Backend Services...\n');

  const services = [
    { name: 'Django API', url: 'http://localhost:8000/api/', port: 8000 },
    { name: 'Node.js API', url: 'http://localhost:3000/api/', port: 3000 },
    { name: 'AI Services', url: 'http://localhost:8001/', port: 8001 }
  ];

  for (const service of services) {
    try {
      console.log(`📡 Testing ${service.name} (${service.url})...`);
      
      // Test basic connectivity
      const response = await axios.get(service.url, { timeout: 5000 });
      console.log(`✅ ${service.name} is running and responding`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ ${service.name} is not running (Connection refused)`);
        console.log(`   Port ${service.port} is not accessible`);
      } else if (error.code === 'ENOTFOUND') {
        console.log(`❌ ${service.name} host not found`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`❌ ${service.name} connection timeout`);
      } else {
        console.log(`❌ ${service.name} error: ${error.message}`);
      }
    }
    console.log('');
  }

  // Test specific Django endpoints
  console.log('🔍 Testing specific Django endpoints...\n');
  
  try {
    const coursesResponse = await axios.get('http://localhost:8000/api/courses/', { timeout: 5000 });
    console.log('✅ Courses endpoint is accessible');
    console.log(`   Status: ${coursesResponse.status}`);
  } catch (error) {
    console.log('❌ Courses endpoint error:', error.message);
  }

  try {
    const studySessionsResponse = await axios.get('http://localhost:8000/api/study-sessions/', { timeout: 5000 });
    console.log('✅ Study Sessions endpoint is accessible');
    console.log(`   Status: ${studySessionsResponse.status}`);
  } catch (error) {
    console.log('❌ Study Sessions endpoint error:', error.message);
  }

  try {
    const progressResponse = await axios.get('http://localhost:8000/api/progress/', { timeout: 5000 });
    console.log('✅ Progress endpoint is accessible');
    console.log(`   Status: ${progressResponse.status}`);
  } catch (error) {
    console.log('❌ Progress endpoint error:', error.message);
  }

  console.log('\n🎯 Recommendations:');
  console.log('1. If services are not running, start them with: docker-compose up -d');
  console.log('2. If services are running but endpoints fail, check authentication');
  console.log('3. If you see CORS errors, check Django CORS settings');
  console.log('4. Check service logs with: docker-compose logs [service_name]');
}

// Run the test
testBackendServices().catch(console.error);






