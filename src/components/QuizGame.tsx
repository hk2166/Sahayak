import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';
import { Loader2, Trophy, Star, Sparkles, Zap, Heart, Target } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizGameProps {
  onClose: () => void;
}

const QuizGame: React.FC<QuizGameProps> = ({ onClose }) => {
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quizId, setQuizId] = useState('');
  const { toast } = useToast();

  // Sound effects
  const playCorrectSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    audio.play().catch(() => {}); // Ignore errors if audio fails
  };

  const playWrongSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    audio.play().catch(() => {}); // Ignore errors if audio fails
  };

  const generateQuiz = async () => {
    if (!topic.trim()) {
      toast({
        title: "Oops! 🎯",
        description: "Please enter a topic for your quiz!",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setQuizId(uniqueId);

    try {
      // Get Gemini API key from environment variable
      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!geminiApiKey) {
        throw new Error("Gemini API key not found. Please check your .env file.");
      }

      // Initialize Google AI
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Generate a unique and engaging quiz about "${topic}" for children. Create exactly 10 multiple-choice questions with 4 options each. Make it fun, educational, and age-appropriate.

Requirements:
- Each question should be different from any previous quiz on this topic
- Include a mix of difficulty levels (easy, medium, hard)
- Use various question types (factual, conceptual, problem-solving)
- Add different question formats (what, how, why, which)
- Include different perspectives and contexts
- Make questions challenging but not overwhelming
- Use clear, simple language suitable for children
- Ensure all options are plausible but only one is correct

Format the response as a JSON array with this exact structure:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0
  }
]

Quiz ID: ${uniqueId}
Topic: ${topic}
Timestamp: ${new Date().toISOString()}

Make each question unique and engaging. The quiz should be different every time, even for the same topic. Only return the JSON array, no additional text.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const quizData = JSON.parse(jsonMatch[0]);
      setQuestions(quizData);
      setCurrentQuestion(0);
      setScore(0);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setShowResults(false);

      toast({
        title: "🎉 Quiz Ready!",
        description: `Your ${topic} quiz is ready to start!`,
      });
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast({
        title: "Oops! 😅",
        description: "Failed to generate quiz. Please try again!",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answerIndex);
    setIsAnswered(true);

    const isCorrect = answerIndex === questions[currentQuestion].correctAnswer;
    
    if (isCorrect) {
      setScore(score + 10);
      playCorrectSound();
      toast({
        title: "🎉 Correct!",
        description: "Great job! You got it right!",
      });
    } else {
      setScore(score - 5);
      playWrongSound();
      toast({
        title: "💪 Keep Trying!",
        description: `The correct answer was: ${questions[currentQuestion].options[questions[currentQuestion].correctAnswer]}`,
        variant: "destructive",
      });
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setIsAnswered(false);
      } else {
        setShowResults(true);
      }
    }, 2000);
  };

  const resetQuiz = () => {
    setQuestions([]);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setShowResults(false);
    setTopic('');
  };

  const getScoreMessage = () => {
    const percentage = (score / (questions.length * 10)) * 100;
    if (percentage >= 90) return { message: "🌟 Amazing! You're a genius!", color: "text-yellow-500" };
    if (percentage >= 80) return { message: "🎯 Excellent! You're doing great!", color: "text-green-500" };
    if (percentage >= 70) return { message: "👍 Good job! Keep learning!", color: "text-blue-500" };
    if (percentage >= 60) return { message: "💪 Nice work! You're improving!", color: "text-purple-500" };
    return { message: "💪 Keep practicing! You'll get better!", color: "text-orange-500" };
  };

  if (showResults) {
    const scoreInfo = getScoreMessage();
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 border-4 border-purple-300 shadow-2xl animate-bounce">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Trophy className="h-16 w-16 text-yellow-500 animate-pulse" />
            </div>
            <CardTitle className="text-3xl font-bold text-purple-800 mb-2">
              Quiz Complete! 🎉
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Star className="h-8 w-8 text-yellow-400 animate-spin" />
                <span className="text-2xl font-bold text-purple-700">
                  Final Score: {score}
                </span>
                <Star className="h-8 w-8 text-yellow-400 animate-spin" />
              </div>
              <div className="text-lg font-semibold text-gray-700">
                Out of {questions.length * 10} points
              </div>
              <div className={`text-xl font-bold ${scoreInfo.color}`}>
                {scoreInfo.message}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                onClick={resetQuiz}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                New Quiz
              </Button>
              <Button 
                onClick={onClose}
                variant="outline"
                className="flex-1 border-2 border-purple-300 text-purple-700 hover:bg-purple-50 font-bold py-3 px-6 rounded-lg transform hover:scale-105 transition-all duration-200"
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md bg-gradient-to-br from-blue-100 via-green-100 to-yellow-100 border-4 border-blue-300 shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Zap className="h-12 w-12 text-blue-500 animate-pulse" />
            </div>
            <CardTitle className="text-2xl font-bold text-blue-800 mb-2">
              🎯 Quiz Time!
            </CardTitle>
            <p className="text-gray-600">
              Enter a topic and let's create an amazing quiz for you!
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic" className="text-lg font-semibold text-gray-700">
                What would you like to learn about?
              </Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Dinosaurs, Space, Animals..."
                className="text-lg p-3 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                onKeyPress={(e) => e.key === 'Enter' && generateQuiz()}
              />
            </div>
            
            <Button 
              onClick={generateQuiz}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-bold py-3 px-6 rounded-lg transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creating Your Quiz...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Quiz
                </>
              )}
            </Button>
            
            <Button 
              onClick={onClose}
              variant="outline"
              className="w-full border-2 border-blue-300 text-blue-700 hover:bg-blue-50 font-bold py-3 px-6 rounded-lg transform hover:scale-105 transition-all duration-200"
            >
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 border-4 border-pink-300 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Target className="h-8 w-8 text-pink-500 animate-pulse" />
            <CardTitle className="text-2xl font-bold text-purple-800">
              {topic} Quiz
            </CardTitle>
            <Target className="h-8 w-8 text-pink-500 animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Question {currentQuestion + 1} of {questions.length}</span>
              <span className="flex items-center">
                <Heart className="h-4 w-4 text-red-500 mr-1" />
                Score: {score}
              </span>
            </div>
            <Progress value={progress} className="h-3 bg-gray-200" />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border-2 border-purple-200 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-6 leading-relaxed">
              {currentQ.question}
            </h3>
            
            <div className="space-y-3">
              {currentQ.options.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={isAnswered}
                  className={`w-full text-left p-4 rounded-lg font-medium text-lg transition-all duration-300 transform hover:scale-105 ${
                    selectedAnswer === index
                      ? index === currentQ.correctAnswer
                        ? 'bg-green-500 text-white shadow-lg scale-105 animate-pulse'
                        : 'bg-red-500 text-white shadow-lg scale-105 animate-pulse'
                      : index === currentQ.correctAnswer && isAnswered
                      ? 'bg-green-500 text-white shadow-lg scale-105 animate-pulse'
                      : 'bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-gray-800 border-2 border-purple-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      selectedAnswer === index
                        ? index === currentQ.correctAnswer
                          ? 'bg-green-600 text-white'
                          : 'bg-red-600 text-white'
                        : index === currentQ.correctAnswer && isAnswered
                        ? 'bg-green-600 text-white'
                        : 'bg-purple-500 text-white'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="flex-1">{option}</span>
                    {selectedAnswer === index && (
                      <div className="text-2xl">
                        {index === currentQ.correctAnswer ? '✅' : '❌'}
                      </div>
                    )}
                    {index === currentQ.correctAnswer && isAnswered && selectedAnswer !== index && (
                      <div className="text-2xl">✅</div>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <Badge variant="secondary" className="bg-purple-200 text-purple-800 font-semibold">
              <Star className="h-4 w-4 mr-1" />
              {score} points
            </Badge>
            
            <Button 
              onClick={onClose}
              variant="outline"
              className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50 font-bold py-2 px-4 rounded-lg transform hover:scale-105 transition-all duration-200"
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizGame; 