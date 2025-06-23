import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Shield, Camera, AlertTriangle } from 'lucide-react';

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
    
    // Navigate to face recognition step
    navigate('/face-recognition');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
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
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
            AI Proctored Online Exam
          </h2>
          <p className="text-gray-600">
            Please provide your details and review exam information before starting
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Exam Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              Exam Information
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium text-gray-900">Duration</div>
                  <div className="text-sm text-gray-600">60 minutes</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Camera className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium text-gray-900">Proctoring</div>
                  <div className="text-sm text-gray-600">AI-powered monitoring</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <div className="font-medium text-gray-900">Requirements</div>
                  <div className="text-sm text-gray-600">Camera, stable internet</div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">What to expect:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Face verification before starting</li>
                <li>• Real-time monitoring during exam</li>
                <li>• Automatic violation detection</li>
                <li>• Timer with warnings</li>
                <li>• Fullscreen mode required</li>
              </ul>
            </div>
          </div>

          {/* Registration Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Enter Your Details
            </h3>
            
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
                <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                >
                  Continue to Face Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamDetails; 