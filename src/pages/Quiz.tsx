import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QuizLayout from '../components/QuizLayout';
import QuizPage1 from './QuizPage1';
import QuizPage2 from './QuizPage2';
import QuizPage3 from './QuizPage3';
import QuizPage4 from './QuizPage4';
import WarningDialog from '../components/WarningDialog';
import TabSwitchWarning from '../components/TabSwitchWarning';
import WebcamFeed from '../components/WebcamFeed';
import { setupQuizSecurity, enterFullscreen } from '../utils/quizSecurity';

interface QuizAnswers {
  [key: string]: string;
}

const MAX_TAB_SWITCHES = 15;

const Quiz = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [showWarning, setShowWarning] = useState(false);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const cleanup = setupQuizSecurity(
      // Fullscreen exit handler
      () => {
        setShowWarning(true);
      },
      // Tab switch handler
      () => {
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          setShowTabWarning(true);
          // Auto end exam if max attempts reached
          if (newCount >= MAX_TAB_SWITCHES) {
            setTimeout(() => {
              navigate('/');
            }, 3000); // Give them 3 seconds to see the final warning
          }
          return newCount;
        });
      }
    );
    return () => cleanup();
  }, [navigate]);

  const handleNextPage = () => {
    if (currentPage < 4) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSubmitExam = async () => {
    try {
      setIsSubmitting(true);
      
      // Here you would typically send the answers to your backend
      // For now, we'll simulate an API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Log the answers for demonstration
      console.log('Exam submitted with answers:', answers);
      
      // Navigate to the results page to view violations
      navigate('/results');
      
    } catch (error) {
      console.error('Error submitting exam:', error);
      // Handle error appropriately
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleTextAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleEndExam = () => {
    // You can add API call here to log the exam termination
    navigate('/');
  };

  const handleReturnToExam = () => {
    setShowWarning(false);
    enterFullscreen();
  };

  const handleTabWarningClose = () => {
    if (tabSwitchCount < MAX_TAB_SWITCHES) {
      setShowTabWarning(false);
    }
  };

  return (
    <>
      <QuizLayout
        currentPage={currentPage}
        totalPages={4}
        onNext={handleNextPage}
        onPrev={handlePrevPage}
        onSubmit={handleSubmitExam}
      >
        {currentPage === 1 && (
          <QuizPage1 
            onAnswerChange={handleAnswerChange} 
            onTextAnswerChange={handleTextAnswerChange}
            answers={answers} 
          />
        )}
        {currentPage === 2 && (
          <QuizPage2 
            onAnswerChange={handleAnswerChange} 
            onTextAnswerChange={handleTextAnswerChange}
            answers={answers} 
          />
        )}
        {currentPage === 3 && (
          <QuizPage3 
            onAnswerChange={handleAnswerChange} 
            onTextAnswerChange={handleTextAnswerChange}
            answers={answers} 
          />
        )}
        {currentPage === 4 && (
          <QuizPage4 
            onAnswerChange={handleAnswerChange} 
            onTextAnswerChange={handleTextAnswerChange}
            answers={answers} 
          />
        )}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-lg font-medium text-gray-700">Submitting your exam...</p>
            </div>
          </div>
        )}
      </QuizLayout>

      <WebcamFeed />

      <WarningDialog
        isOpen={showWarning}
        onClose={handleReturnToExam}
        onEndExam={handleEndExam}
      />

      <TabSwitchWarning
        isOpen={showTabWarning}
        onClose={handleTabWarningClose}
        onEndExam={handleEndExam}
        switchCount={tabSwitchCount}
      />
    </>
  );
};

export default Quiz;
