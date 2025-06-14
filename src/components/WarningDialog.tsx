import React from 'react';
import { useNavigate } from 'react-router-dom';

interface WarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onEndExam: () => void;
}

const WarningDialog: React.FC<WarningDialogProps> = ({ isOpen, onClose, onEndExam }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-600"
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
            Warning: Fullscreen Exit Attempt
          </h3>
        </div>
        
        <p className="text-gray-600 mb-8">
          You attempted to exit fullscreen mode. This action is not allowed during the exam. 
          Would you like to end the exam or return to it?
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onEndExam}
            className="w-full sm:w-1/2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            End Exam
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-1/2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Return to Exam
          </button>
        </div>
      </div>
    </div>
  );
};

export default WarningDialog; 