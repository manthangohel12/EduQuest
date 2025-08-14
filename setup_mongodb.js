const { MongoClient } = require('mongodb');

async function setupMongoDB() {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('eduquest_app');
    
    // Create collections
    const collections = [
      'users',
      'courses', 
      'learning_paths',
      'quizzes',
      'study_sessions',
      'progress',
      'ai_explanations',
      'chat_sessions'
    ];

    for (const collectionName of collections) {
      try {
        await db.createCollection(collectionName);
        console.log(`✅ Created collection: ${collectionName}`);
      } catch (error) {
        if (error.code === 48) { // Collection already exists
          console.log(`ℹ️  Collection already exists: ${collectionName}`);
        } else {
          console.error(`❌ Error creating collection ${collectionName}:`, error.message);
        }
      }
    }

    // Create indexes for better performance
    const usersCollection = db.collection('users');
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await usersCollection.createIndex({ username: 1 }, { unique: true });
    console.log('✅ Created indexes for users collection');

    const coursesCollection = db.collection('courses');
    await coursesCollection.createIndex({ title: 1 });
    await coursesCollection.createIndex({ difficulty: 1 });
    console.log('✅ Created indexes for courses collection');

    const quizzesCollection = db.collection('quizzes');
    await quizzesCollection.createIndex({ courseId: 1 });
    await quizzesCollection.createIndex({ difficulty: 1 });
    console.log('✅ Created indexes for quizzes collection');

    const studySessionsCollection = db.collection('study_sessions');
    await studySessionsCollection.createIndex({ userId: 1 });
    await studySessionsCollection.createIndex({ createdAt: -1 });
    console.log('✅ Created indexes for study_sessions collection');

    const progressCollection = db.collection('progress');
    await progressCollection.createIndex({ userId: 1 });
    await progressCollection.createIndex({ courseId: 1 });
    console.log('✅ Created indexes for progress collection');

    const chatSessionsCollection = db.collection('chat_sessions');
    await chatSessionsCollection.createIndex({ userId: 1 });
    await chatSessionsCollection.createIndex({ createdAt: -1 });
    console.log('✅ Created indexes for chat_sessions collection');

    console.log('\n🎉 MongoDB setup completed successfully!');
    console.log('�� Database: eduquest_app');
    console.log('📁 Collections created:');
    collections.forEach(collection => {
      console.log(`   - ${collection}`);
    });

  } catch (error) {
    console.error('❌ Error setting up MongoDB:', error);
  } finally {
    await client.close();
  }
}

setupMongoDB(); 