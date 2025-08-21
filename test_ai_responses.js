// Test script for AI response generation
// This simulates the generateAIResponse function from StudyChat.js

function generateAIResponse(userQuestion) {
  const question = userQuestion.toLowerCase();
  
  // Enhanced response logic with more subjects and detailed explanations
  const responses = {
    // Mathematics
    'math': {
      'algebra': "Algebra is the branch of mathematics that deals with symbols and the rules for manipulating these symbols. It's like solving puzzles where you need to find the value of unknown variables. For example, in the equation 2x + 3 = 11, you'd solve for x by subtracting 3 from both sides (2x = 8) and then dividing by 2 (x = 4).",
      'calculus': "Calculus is the mathematical study of continuous change. It has two main branches: differential calculus (studying rates of change) and integral calculus (studying accumulation of quantities). Think of it as the mathematics of motion and growth - it helps us understand how things change over time.",
      'geometry': "Geometry is the study of shapes, sizes, positions, and dimensions. It's everywhere around us - from the angles of a triangle to the curves of a circle. Practical applications include architecture, engineering, and even art!",
      'trigonometry': "Trigonometry deals with the relationships between the sides and angles of triangles. It's essential for understanding waves, sound, light, and many real-world phenomena. The basic functions are sine, cosine, and tangent."
    },
    
    // Science
    'science': {
      'physics': "Physics is the study of matter, energy, and their interactions. It explains everything from how objects fall to how light travels. Key concepts include forces, motion, energy, and waves. It's the foundation for understanding how our universe works!",
      'chemistry': "Chemistry is the study of matter and the changes it undergoes. It explains how atoms combine to form molecules, how reactions occur, and why materials have different properties. Everything around us is made of chemicals!",
      'biology': "Biology is the study of living organisms and their interactions with each other and their environment. It covers everything from cells and genetics to ecosystems and evolution. It helps us understand life itself!",
      'astronomy': "Astronomy is the study of celestial objects and phenomena beyond Earth's atmosphere. It explores planets, stars, galaxies, and the universe as a whole. It's one of the oldest sciences and continues to reveal amazing discoveries!"
    },
    
    // History
    'history': {
      'ancient': "Ancient history covers the period from the beginning of recorded human history to the fall of the Western Roman Empire in 476 CE. It includes civilizations like Egypt, Greece, Rome, China, and Mesopotamia. These societies laid the foundation for modern civilization!",
      'medieval': "Medieval history spans roughly from the 5th to the 15th century. It was a time of knights, castles, feudalism, and the rise of powerful kingdoms. The period saw significant developments in art, architecture, and culture.",
      'modern': "Modern history begins around the 15th century with the Renaissance and continues to the present. It includes the Age of Exploration, Industrial Revolution, World Wars, and the digital age. It's marked by rapid technological and social change."
    },
    
    // Literature
    'literature': {
      'poetry': "Poetry is a form of literary expression that uses aesthetic and rhythmic qualities of language. It can be structured (like sonnets) or free verse. Poetry often uses metaphor, simile, and imagery to convey emotions and ideas in a condensed form.",
      'novels': "Novels are long-form fictional narratives that tell stories through characters, plot, and setting. They can explore complex themes and provide deep insights into human nature and society. Different genres include romance, mystery, science fiction, and historical fiction.",
      'drama': "Drama is literature intended for performance. It includes plays, scripts, and theatrical works. Drama can be comedy, tragedy, or a mix of both, and it explores human conflicts and emotions through dialogue and action."
    },
    
    // Computer Science
    'programming': "Programming is the process of creating instructions for computers to follow. It involves writing code in programming languages like Python, JavaScript, or Java. Programming is used to create software, websites, apps, and solve complex problems. It's like giving a computer a recipe to follow!",
    'coding': "Coding is writing instructions in a programming language that a computer can understand and execute. It's like learning a new language - you need to understand syntax, logic, and problem-solving. Coding skills are valuable in many fields today!",
    
    // Study Skills
    'study': "Effective studying involves active learning techniques like summarizing, questioning, and testing yourself. Break down complex topics into smaller parts, use spaced repetition, and connect new information to what you already know. Regular review and practice are key!",
    'learning': "Learning is most effective when you're actively engaged. Use techniques like mind mapping, teaching others, and applying concepts to real-world examples. Everyone learns differently, so experiment with various methods to find what works best for you!",
    
    // General Knowledge
    'what is': "I'd be happy to explain that concept! Could you provide more specific details about what you'd like to understand? I can break down complex topics into simple terms and provide examples to help you learn.",
    'how to': "I can help you learn step-by-step! Please give me more details about what you're trying to accomplish, and I'll provide a clear explanation with practical examples.",
    'explain': "I'd love to help explain that! To give you the most helpful response, could you provide more context or specific details about what you'd like me to clarify?"
  };

  // Check for specific subject matches first
  for (const [subject, topics] of Object.entries(responses)) {
    if (typeof topics === 'object') {
      // This is a subject with multiple topics
      for (const [topic, explanation] of Object.entries(topics)) {
        if (question.includes(topic)) {
          return explanation;
        }
      }
    } else if (question.includes(subject)) {
      // This is a general subject
      return topics;
    }
  }

  // Check for specific question patterns
  if (question.includes('quantum')) {
    return "Quantum physics deals with the behavior of matter and energy at the atomic and subatomic levels. Unlike classical physics, quantum mechanics shows that particles can exist in multiple states simultaneously (superposition) and can be connected regardless of distance (entanglement). It's the foundation of modern technologies like lasers, transistors, and quantum computers!";
  }
  
  if (question.includes('derivative') || question.includes('differentiation')) {
    return "A derivative measures how fast something is changing at any given moment. In calculus, it's the rate of change of a function. For example, if you're driving a car, the derivative of your position gives you your speed, and the derivative of your speed gives you your acceleration. It's like taking a snapshot of change at an instant!";
  }
  
  if (question.includes('machine learning') || question.includes('ai')) {
    return "Machine learning is a subset of artificial intelligence where computers learn patterns from data without being explicitly programmed. Think of it as teaching a computer to recognize patterns the way humans do, but using algorithms and statistics. It's used in recommendation systems, image recognition, language processing, and many other applications!";
  }
  
  if (question.includes('water cycle')) {
    return "The water cycle is how water moves around our planet through evaporation, condensation, precipitation, and collection. Water evaporates from oceans and lakes, forms clouds, falls as rain or snow, and flows back to oceans. It's nature's way of recycling water and is essential for all life on Earth!";
  }
  
  if (question.includes('quadratic')) {
    return "Quadratic equations are equations with x² terms. They form parabolas when graphed and can have 0, 1, or 2 real solutions. You can solve them using factoring, completing the square, or the quadratic formula: x = (-b ± √(b² - 4ac)) / 2a. They're used in physics, engineering, and many real-world applications!";
  }
  
  if (question.includes('mitosis') || question.includes('meiosis')) {
    return "Mitosis and meiosis are both cell division processes, but they serve different purposes. Mitosis creates two identical cells for growth and repair. Meiosis creates four cells with half the chromosomes for reproduction. Think of mitosis as copying a book (duplication), and meiosis as creating a summary (reduction division)!";
  }
  
  if (question.includes('ancient') || question.includes('civilization')) {
    return "Ancient civilizations were the first complex human societies that emerged thousands of years ago. They include Mesopotamia (the first civilization), Ancient Egypt with its pyramids and pharaohs, Ancient Greece with democracy and philosophy, Ancient Rome with its empire and law, and Ancient China with its dynasties and inventions. These societies developed writing, agriculture, architecture, and complex social structures that laid the foundation for modern civilization!";
  }
  
  if (question.includes('photosynthesis')) {
    return "Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose (sugar) and oxygen. It's like a natural solar panel! Plants use chlorophyll (the green pigment) to capture sunlight energy. This process is crucial for life on Earth because it produces oxygen for animals to breathe and provides the energy foundation for most food chains. Without photosynthesis, life as we know it wouldn't exist!";
  }
  
  if (question.includes('renaissance')) {
    return "The Renaissance was a period of great cultural, artistic, and intellectual rebirth in Europe from the 14th to 17th centuries. It marked the transition from the Middle Ages to modern times. Key features include a renewed interest in classical Greek and Roman culture, the development of humanism, amazing advances in art (like Leonardo da Vinci and Michelangelo), scientific discoveries, and the beginning of the Age of Exploration. It was a time when people began to question old beliefs and explore new ideas!";
  }
  
  if (question.includes('atom') || question.includes('molecule')) {
    return "Atoms are the basic building blocks of matter - they're incredibly tiny! When atoms join together, they form molecules. Think of atoms like LEGO pieces and molecules like the structures you build with them. For example, two hydrogen atoms and one oxygen atom join to form a water molecule (H₂O). The way atoms connect depends on their electrons and chemical properties. This bonding creates everything from simple water to complex proteins in your body!";
  }

  // If no specific match, provide a helpful general response
  return "I'd be happy to help you learn! To give you the most helpful response, could you please provide more specific details about what you'd like to understand? I can explain concepts, solve problems, or help you with any subject you're studying. What specific topic or question do you have in mind?";
}

// Test the AI response generation
console.log('🧪 Testing AI Response Generation...\n');

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
  "What is a random topic?"
];

testQuestions.forEach((question, index) => {
  console.log(`Question ${index + 1}: ${question}`);
  const response = generateAIResponse(question);
  console.log(`Response: ${response.substring(0, 100)}...`);
  console.log('---');
});

console.log('✅ AI Response Generation Test Complete!');
console.log('The chat should now provide intelligent, contextual responses instead of generic ones.');
