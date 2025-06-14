import React from 'react';

interface TabSwitchWarningProps {
  isOpen: boolean;
  onClose: () => void;
  onEndExam: () => void;
  switchCount: number;
}

const TabSwitchWarning: React.FC<TabSwitchWarningProps> = ({ 
  isOpen, 
  onClose, 
  onEndExam,
  switchCount 
}) => {
  if (!isOpen) return null;

  const isMaxAttemptsReached = switchCount >= 15;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 ml-4">
            Warning: Tab Switch Detected
          </h3>
        </div>
        
        <div className="space-y-4">
          <div className={`border-l-4 p-4 ${
            isMaxAttemptsReached 
              ? 'bg-red-50 border-red-400' 
              : 'bg-yellow-50 border-yellow-400'
          }`}>
            <p className={`text-sm ${
              isMaxAttemptsReached ? 'text-red-700' : 'text-yellow-700'
            }`}>
              {isMaxAttemptsReached ? (
                <span className="font-medium">
                  Maximum tab switches detected. Your exam will be terminated.
                </span>
              ) : (
                <span>
                  You have attempted to switch tabs or windows. This is not allowed during the exam. 
                  Further attempts may result in exam termination.
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button
            onClick={onEndExam}
            className="w-full sm:w-1/2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            End Exam
          </button>
          <button
            onClick={onClose}
            disabled={isMaxAttemptsReached}
            className={`w-full sm:w-1/2 px-4 py-2 rounded-lg transition-colors ${
              isMaxAttemptsReached
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isMaxAttemptsReached ? 'Return Disabled' : 'Return to Exam'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TabSwitchWarning; 