const { MongoClient } = require('mongodb');

async function populateMongoDB() {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('eduquest_app');
    
    // Sample users
    const users = [
      {
        username: 'admin',
        email: 'admin@eduquest.com',
        firstName: 'Admin',
        lastName: 'User',
        isAdmin: true,
        learningPreferences: {
          learningStyle: 'visual',
          difficultyPreference: 'intermediate',
          preferredSubjects: ['Mathematics', 'Science', 'Programming']
        },
        studyStats: {
          totalStudyTime: 120,
          totalCoursesCompleted: 3,
          currentStreak: 5,
          longestStreak: 10
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'student1',
        email: 'student1@eduquest.com',
        firstName: 'John',
        lastName: 'Doe',
        isAdmin: false,
        learningPreferences: {
          learningStyle: 'kinesthetic',
          difficultyPreference: 'beginner',
          preferredSubjects: ['Mathematics', 'Physics']
        },
        studyStats: {
          totalStudyTime: 60,
          totalCoursesCompleted: 1,
          currentStreak: 2,
          longestStreak: 3
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Sample courses
    const courses = [
      {
        title: 'Introduction to Python Programming',
        description: 'Learn the basics of Python programming language',
        difficulty: 'beginner',
        duration: 120,
        topics: ['Variables', 'Data Types', 'Control Structures', 'Functions'],
        instructor: 'Dr. Smith',
        rating: 4.5,
        enrolledStudents: 25,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Advanced Mathematics',
        description: 'Advanced mathematical concepts and problem solving',
        difficulty: 'advanced',
        duration: 180,
        topics: ['Calculus', 'Linear Algebra', 'Differential Equations'],
        instructor: 'Prof. Johnson',
        rating: 4.8,
        enrolledStudents: 15,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Data Science Fundamentals',
        description: 'Introduction to data science and machine learning',
        difficulty: 'intermediate',
        duration: 150,
        topics: ['Statistics', 'Data Analysis', 'Machine Learning Basics'],
        instructor: 'Dr. Williams',
        rating: 4.6,
        enrolledStudents: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Sample quizzes
    const quizzes = [
      {
        title: 'Python Basics Quiz',
        description: 'Test your knowledge of Python fundamentals',
        courseId: 'python_course',
        difficulty: 'beginner',
        questions: [
          {
            question: 'What is the correct way to declare a variable in Python?',
            options: ['var x = 5', 'x = 5', 'let x = 5', 'const x = 5'],
            correctAnswer: 1,
            explanation: 'In Python, you simply assign a value to create a variable.'
          },
          {
            question: 'Which data type is used for whole numbers in Python?',
            options: ['float', 'int', 'string', 'boolean'],
            correctAnswer: 1,
            explanation: 'The int data type is used for whole numbers in Python.'
          }
        ],
        timeLimit: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Sample study sessions
    const studySessions = [
      {
        userId: 'student1',
        courseId: 'python_course',
        title: 'Python Variables and Data Types',
        duration: 45,
        topicsCovered: ['Variables', 'Data Types'],
        progressPercentage: 75,
        notes: 'Learned about different data types and variable declaration',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Sample progress records
    const progressRecords = [
      {
        userId: 'student1',
        courseId: 'python_course',
        completionPercentage: 60,
        timeSpent: 90,
        lastAccessed: new Date(),
        strengths: ['Variables', 'Basic Syntax'],
        weaknesses: ['Functions', 'Object-Oriented Programming'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert sample data
    console.log('📝 Inserting sample data...');

    // Insert users
    const usersCollection = db.collection('users');
    for (const user of users) {
      try {
        await usersCollection.insertOne(user);
        console.log(`✅ Inserted user: ${user.username}`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`ℹ️  User already exists: ${user.username}`);
        } else {
          console.error(`❌ Error inserting user ${user.username}:`, error.message);
        }
      }
    }

    // Insert courses
    const coursesCollection = db.collection('courses');
    for (const course of courses) {
      try {
        await coursesCollection.insertOne(course);
        console.log(`✅ Inserted course: ${course.title}`);
      } catch (error) {
        console.error(`❌ Error inserting course ${course.title}:`, error.message);
      }
    }

    // Insert quizzes
    const quizzesCollection = db.collection('quizzes');
    for (const quiz of quizzes) {
      try {
        await quizzesCollection.insertOne(quiz);
        console.log(`✅ Inserted quiz: ${quiz.title}`);
      } catch (error) {
        console.error(`❌ Error inserting quiz ${quiz.title}:`, error.message);
      }
    }

    // Insert study sessions
    const studySessionsCollection = db.collection('study_sessions');
    for (const session of studySessions) {
      try {
        await studySessionsCollection.insertOne(session);
        console.log(`✅ Inserted study session: ${session.title}`);
      } catch (error) {
        console.error(`❌ Error inserting study session ${session.title}:`, error.message);
      }
    }

    // Insert progress records
    const progressCollection = db.collection('progress');
    for (const progress of progressRecords) {
      try {
        await progressCollection.insertOne(progress);
        console.log(`✅ Inserted progress record for user: ${progress.userId}`);
      } catch (error) {
        console.error(`❌ Error inserting progress record:`, error.message);
      }
    }

    console.log('\n🎉 MongoDB population completed successfully!');
    console.log('📊 Sample data inserted:');
    console.log('   - 2 users (admin, student1)');
    console.log('   - 3 courses (Python, Mathematics, Data Science)');
    console.log('   - 1 quiz (Python Basics)');
    console.log('   - 1 study session');
    console.log('   - 1 progress record');

  } catch (error) {
    console.error('❌ Error populating MongoDB:', error);
  } finally {
    await client.close();
  }
}

populateMongoDB(); 