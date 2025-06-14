import React from 'react';
import { useNavigate } from 'react-router-dom';

const Results: React.FC = () => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-4 text-center">Exam Results</h1>
        <p className="text-center text-gray-600">Your exam has been submitted successfully.</p>
        <button 
          onClick={handleBackToHome}
          className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default Results;
