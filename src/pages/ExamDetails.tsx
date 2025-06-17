import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ExamDetails: React.FC = () => {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState('');
  const [examId, setExamId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!studentId.trim() || !examId.trim()) {
      setError('Please fill in all fields');
      return;
    }

    // Store the IDs in localStorage for use in the exam
    localStorage.setItem('studentId', studentId);
    localStorage.setItem('examId', examId);
    
    // Navigate to the exam
    navigate('/quiz');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/signin')}
            className="flex items-center text-emerald-600 hover:text-emerald-500"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Sign In
          </button>
          <h2 className="text-2xl font-bold text-emerald-600">AI Proctor</h2>
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          Enter Exam Details
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please provide your student ID and exam ID to begin
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
                Student ID
              </label>
              <div className="mt-1">
                <input
                  id="studentId"
                  name="studentId"
                  type="text"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="Enter your student ID"
                />
              </div>
            </div>

            <div>
              <label htmlFor="examId" className="block text-sm font-medium text-gray-700">
                Exam ID
              </label>
              <div className="mt-1">
                <input
                  id="examId"
                  name="examId"
                  type="text"
                  required
                  value={examId}
                  onChange={(e) => setExamId(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="Enter your exam ID"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                Start Exam
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExamDetails; 