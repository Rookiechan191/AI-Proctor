import React from 'react';

interface QuizPage1Props {
  onAnswerChange: (questionId: string, answer: string) => void;
  onTextAnswerChange: (questionId: string, answer: string) => void;
  answers: Record<string, string>;
}

const QuizPage1: React.FC<QuizPage1Props> = ({
  onAnswerChange,
  onTextAnswerChange,
  answers
}) => {
  return (
    <div className="space-y-12">
      {/* MCQ Question 1 */}
      <div className="border-b border-gray-200 pb-10">
        <div className="mb-6">
          <span className="inline-flex items-center justify-center px-4 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
            Question 1 (Multiple Choice)
          </span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          What is the capital of France?
        </h2>
        <div className="grid gap-4">
          {['Paris', 'London', 'Berlin', 'Madrid'].map(option => (
            <label
              key={option}
              className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                answers['q1'] === option
                  ? 'border-emerald-600 bg-emerald-50'
                  : 'border-gray-200 hover:border-emerald-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="q1"
                value={option}
                checked={answers['q1'] === option}
                onChange={() => onAnswerChange('q1', option)}
                className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 border-gray-300"
              />
              <span className="ml-4 text-lg font-medium text-gray-900">
                {option}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Subjective Question */}
      <div className="border-b border-gray-200 pb-10">
        <div className="mb-6">
          <span className="inline-flex items-center justify-center px-4 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
            Question 2 (Subjective)
          </span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Explain the concept of artificial intelligence in your own words.
        </h2>
        <p className="text-gray-600 mb-6">
          Write a detailed answer (minimum 100 words)
        </p>
        <div className="relative">
          <textarea
            value={answers['q2_subjective'] || ''}
            onChange={(e) => onTextAnswerChange('q2_subjective', e.target.value)}
            className="w-full min-h-[200px] p-4 border-2 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
            placeholder="Type your answer here..."
            onCopy={(e) => e.preventDefault()}
            onPaste={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
          ></textarea>
          <div className="absolute bottom-4 right-4 text-sm text-gray-500">
            {(answers['q2_subjective'] || '').length} words
          </div>
        </div>
      </div>

      {/* MCQ Question 2 */}
      <div>
        <div className="mb-6">
          <span className="inline-flex items-center justify-center px-4 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
            Question 3 (Multiple Choice)
          </span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Which planet is known as the Red Planet?
        </h2>
        <div className="grid gap-4">
          {['Venus', 'Mars', 'Jupiter', 'Saturn'].map(option => (
            <label
              key={option}
              className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                answers['q3'] === option
                  ? 'border-emerald-600 bg-emerald-50'
                  : 'border-gray-200 hover:border-emerald-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="q3"
                value={option}
                checked={answers['q3'] === option}
                onChange={() => onAnswerChange('q3', option)}
                className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 border-gray-300"
              />
              <span className="ml-4 text-lg font-medium text-gray-900">
                {option}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizPage1; 