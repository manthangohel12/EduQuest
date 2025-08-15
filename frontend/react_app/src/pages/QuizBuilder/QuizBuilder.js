import React, { useState } from 'react';
import { HelpCircle, Play, CheckCircle, XCircle, Clock, Target, FileText, Sparkles } from 'lucide-react';
import { aiService, apiService, apiUtils } from '../../services/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const QuizBuilder = () => {
  const [content, setContent] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [quizSettings, setQuizSettings] = useState({
    numQuestions: 5,
    difficulty: 'medium',
    questionTypes: ['multiple_choice']
  });

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const handleGenerateQuiz = async () => {
    if (!content.trim()) {
      apiUtils.handleError(new Error('Please enter some content to generate a quiz'));
      return;
    }

    setLoading(true);
    try {
      // Generate and set the quiz
      const response = await aiService.generateQuiz(content, {
        num_questions: quizSettings.numQuestions,
        difficulty: quizSettings.difficulty,
        question_types: quizSettings.questionTypes
      });

      const quizData = response.data;
      setQuiz(quizData);
      setCurrentQuestion(0);
      setAnswers({});
      setShowResults(false);
      setScore(0);
      
      // The quiz is already saved by the generateQuiz endpoint
      apiUtils.handleSuccess('Quiz generated successfully!');
    } catch (error) {
      apiUtils.handleError(error, 'Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = () => {
    let correctAnswers = 0;
    const totalQuestions = quiz.questions.length;

    quiz.questions.forEach((question, index) => {
      const userAnswer = answers[question.id];
      if (userAnswer === question.correct_answer) {
        correctAnswers++;
      }
    });

    const finalScore = Math.round((correctAnswers / totalQuestions) * 100);
    setScore(finalScore);
    setShowResults(true);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (score) => {
    if (score >= 90) return 'Excellent! You have mastered this topic.';
    if (score >= 80) return 'Great job! You have a solid understanding.';
    if (score >= 60) return 'Good work! Keep practicing to improve.';
    return 'Keep studying! Review the material and try again.';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quiz Builder</h1>
          <p className="text-gray-600">Generate and take AI-powered quizzes from any content</p>
        </div>
        <div className="flex items-center space-x-2">
          <Sparkles className="w-6 h-6 text-primary-600" />
          <span className="text-sm font-medium text-primary-600">AI-Generated</span>
        </div>
      </div>

      {!quiz ? (
        /* Quiz Generation Section */
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Quiz</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content for Quiz Generation
                </label>
                <textarea
                  value={content}
                  onChange={handleContentChange}
                  placeholder="Paste or type content to generate quiz questions..."
                  className="w-full h-48 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Questions
                  </label>
                  <select
                    value={quizSettings.numQuestions}
                    onChange={(e) => setQuizSettings(prev => ({ ...prev, numQuestions: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value={3}>3 Questions</option>
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={quizSettings.difficulty}
                    onChange={(e) => setQuizSettings(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Types
                  </label>
                  <select
                    value={quizSettings.questionTypes[0]}
                    onChange={(e) => setQuizSettings(prev => ({ ...prev, questionTypes: [e.target.value] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True/False</option>
                    <option value="fill_blank">Fill in the Blank</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerateQuiz}
                disabled={loading || !content.trim()}
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                <span>{loading ? 'Generating Quiz...' : 'Generate Quiz'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Quiz Taking Section */
        <div className="space-y-6">
          {!showResults ? (
            <>
              {/* Quiz Header */}
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Quiz</h2>
                    <p className="text-sm text-gray-600">
                      Question {currentQuestion + 1} of {quiz.questions.length}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-gray-500" />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(quiz.estimated_difficulty)}`}>
                        {quiz.estimated_difficulty}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">No time limit</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Question */}
              <div className="card">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {quiz.questions[currentQuestion].question}
                    </h3>

                    <div className="space-y-3">
                      {quiz.questions[currentQuestion].options.map((option, index) => (
                        <label
                          key={index}
                          className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                            answers[quiz.questions[currentQuestion].id] === option
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${quiz.questions[currentQuestion].id}`}
                            value={option}
                            checked={answers[quiz.questions[currentQuestion].id] === option}
                            onChange={() => handleAnswerSelect(quiz.questions[currentQuestion].id, option)}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 border-2 rounded-full mr-3 ${
                            answers[quiz.questions[currentQuestion].id] === option
                              ? 'border-primary-500 bg-primary-500'
                              : 'border-gray-300'
                          }`}>
                            {answers[quiz.questions[currentQuestion].id] === option && (
                              <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                            )}
                          </div>
                          <span className="text-gray-900">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <button
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestion === 0}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    <div className="flex items-center space-x-2">
                      {Array.from({ length: quiz.questions.length }, (_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentQuestion(index)}
                          className={`w-8 h-8 rounded-full text-sm font-medium ${
                            currentQuestion === index
                              ? 'bg-primary-600 text-white'
                              : answers[quiz.questions[index].id]
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>

                    {currentQuestion === quiz.questions.length - 1 ? (
                      <button
                        onClick={handleSubmitQuiz}
                        className="btn-primary"
                      >
                        Submit Quiz
                      </button>
                    ) : (
                      <button
                        onClick={handleNextQuestion}
                        className="btn-primary"
                      >
                        Next
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Results Section */
            <div className="card">
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center">
                  {score >= 80 ? (
                    <CheckCircle className="w-16 h-16 text-green-600" />
                  ) : (
                    <XCircle className="w-16 h-16 text-red-600" />
                  )}
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
                  <p className={`text-3xl font-bold ${getScoreColor(score)}`}>
                    {score}%
                  </p>
                  <p className="text-gray-600 mt-2">{getScoreMessage(score)}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Questions</p>
                    <p className="text-2xl font-bold text-gray-900">{quiz.questions.length}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Correct Answers</p>
                    <p className="text-2xl font-bold text-green-600">
                      {Math.round((score / 100) * quiz.questions.length)}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Difficulty</p>
                    <p className="text-2xl font-bold text-gray-900 capitalize">{quiz.estimated_difficulty}</p>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => {
                      setQuiz(null);
                      setContent('');
                      setAnswers({});
                      setShowResults(false);
                      setScore(0);
                    }}
                    className="btn-primary"
                  >
                    Create New Quiz
                  </button>
                  <button
                    onClick={() => {
                      setCurrentQuestion(0);
                      setAnswers({});
                      setShowResults(false);
                      setScore(0);
                    }}
                    className="btn-secondary"
                  >
                    Retake Quiz
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizBuilder; 