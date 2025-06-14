import React from 'react';

interface QuizLayoutProps {
  children: React.ReactNode;
  currentPage: number;
  totalPages: number;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
}

const QuizLayout: React.FC<QuizLayoutProps> = ({
  children,
  currentPage,
  totalPages,
  onNext,
  onPrev,
  onSubmit
}) => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-emerald-600 text-white px-8 py-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold">AI Proctored Exam</h1>
              <div className="text-lg font-medium">
                Question {currentPage} of {totalPages}
              </div>
            </div>
            <div className="w-full bg-emerald-700/50 rounded-full h-3">
              <div
                className="bg-white h-3 rounded-full transition-all duration-300"
                style={{ width: `${(currentPage / totalPages) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 lg:p-12">
            {children}
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-gray-50 border-t">
            <div className="flex justify-between items-center max-w-4xl mx-auto">
              <button
                onClick={onPrev}
                disabled={currentPage === 1}
                className={`px-8 py-3 rounded-lg text-base font-medium transition-colors ${
                  currentPage === 1
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg'
                }`}
              >
                Previous
              </button>
              <button
                onClick={currentPage === totalPages ? onSubmit : onNext}
                className="px-8 py-3 rounded-lg text-base font-medium transition-colors bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg"
              >
                {currentPage === totalPages ? 'Submit' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizLayout; 