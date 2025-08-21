const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🔌 Testing MongoDB connection...');
    
    // Test MongoDB connection
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eduquest_app', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connected successfully');
    
    // Test if we can create a simple document
    const TestSchema = new mongoose.Schema({ name: String, timestamp: Date });
    const Test = mongoose.model('Test', TestSchema);
    
    const testDoc = new Test({ name: 'test', timestamp: new Date() });
    await testDoc.save();
    console.log('✅ Database write test passed');
    
    await Test.deleteOne({ name: 'test' });
    console.log('✅ Database delete test passed');
    
    console.log('\n🎉 All tests passed! Your backend is ready.');
    console.log('\n📝 Next steps:');
    console.log('1. Make sure your backend is running on port 3001');
    console.log('2. Open your frontend in the browser');
    console.log('3. Click "Start New Session" to begin chatting');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure MongoDB is running');
    console.log('2. Check your .env file has correct MONGODB_URI');
    console.log('3. Verify MongoDB is accessible on the specified port');
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testConnection();

