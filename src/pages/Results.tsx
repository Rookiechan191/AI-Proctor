import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Violation {
  type: string;
  confidence: number;
  timestamp: string;
  details: string;
}

const Results: React.FC = () => {
  const navigate = useNavigate();
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchViolations = async () => {
      try {
        const studentId = localStorage.getItem('studentId');
        const examId = localStorage.getItem('examId');

        if (!studentId || !examId) {
          setError('Student ID or Exam ID not found');
          return;
        }

        const response = await fetch(
          `http://localhost:5000/get_violations?student_id=${studentId}&exam_id=${examId}`
        );
        const data = await response.json();

        if (data.success) {
          setViolations(data.violations);
        } else {
          setError(data.error || 'Failed to fetch violations');
        }
      } catch (err) {
        setError('Error fetching violations');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchViolations();
  }, []);

  const handleBackToHome = () => {
    navigate('/');
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getViolationIcon = (type: string) => {
    switch (type) {
      case 'multiple_faces':
        return '👥';
      case 'looking_away':
        return '👀';
      case 'head_turning':
        return '🔄';
      case 'device_detected':
        return '📱';
      default:
        return '⚠️';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl">
        <h1 className="text-2xl font-bold mb-4 text-center">Exam Results</h1>
        
        {error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-center text-gray-600">
                Your exam has been submitted successfully.
              </p>
            </div>

            {violations.length > 0 ? (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center text-red-600">
                  <AlertTriangle className="mr-2" />
                  Detected Violations
                </h2>
                <div className="space-y-4">
                  {violations.map((violation, index) => (
                    <div
                      key={`${violation.type}-${violation.timestamp}`}
                      className="bg-red-50 border-l-4 border-red-400 p-4 rounded"
                    >
                      <div className="flex items-start">
                        <span className="text-2xl mr-3">
                          {getViolationIcon(violation.type)}
                        </span>
                        <div>
                          <h3 className="font-medium text-red-800 capitalize">
                            {violation.type.replace('_', ' ')}
                          </h3>
                          <p className="text-sm text-red-600">
                            {violation.details}
                          </p>
                          <p className="text-xs text-red-500 mt-1">
                            Detected at: {formatTimestamp(violation.timestamp)}
                          </p>
                          <p className="text-xs text-red-500">
                            Confidence: {Math.round(violation.confidence * 100)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded">
                <div className="flex items-center">
                  <CheckCircle2 className="text-green-500 mr-2" />
                  <p className="text-green-700">No violations detected during the exam.</p>
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex justify-center">
        <button 
          onClick={handleBackToHome}
            className="bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700 transition-colors"
        >
          Back to Home
        </button>
        </div>
      </div>
    </div>
  );
};

export default Results;
