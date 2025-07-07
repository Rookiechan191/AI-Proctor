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
  const [fullscreenExitCount, setFullscreenExitCount] = useState<number | null>(null);
  const [tabSwitchCount, setTabSwitchCount] = useState<number | null>(null);

  useEffect(() => {
    // Read fullscreen exit count and tab switch count from localStorage
    const count = localStorage.getItem('fullscreenExitCount');
    setFullscreenExitCount(count ? parseInt(count, 10) : null);
    const tabCount = localStorage.getItem('tabSwitchCount');
    setTabSwitchCount(tabCount ? parseInt(tabCount, 10) : null);
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
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-red-50 border border-red-200 rounded shadow text-sm">
                    <thead className="bg-red-100 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-2 text-left text-red-800 font-semibold whitespace-nowrap">
                          <span className="mr-1">⚠️</span>Type
                        </th>
                        <th className="px-4 py-2 text-left text-red-800 font-semibold whitespace-nowrap">
                          <span className="mr-1">📝</span>Details
                        </th>
                        <th className="px-4 py-2 text-left text-red-800 font-semibold whitespace-nowrap">
                          <span className="mr-1">⏰</span>Timestamps
                        </th>
                        <th className="px-4 py-2 text-left text-red-800 font-semibold whitespace-nowrap">
                          <span className="mr-1">📊</span>Confidence
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(
                        violations.reduce((acc, v) => {
                          if (!acc[v.type]) {
                            acc[v.type] = { ...v, timestamps: [v.timestamp] };
                          } else {
                            acc[v.type].timestamps.push(v.timestamp);
                          }
                          return acc;
                        }, {} as Record<string, Violation & { timestamps: string[] }>))
                        .map(([type, v], idx) => (
                          <tr key={type} className={
                            `border-t border-red-200 ${idx % 2 === 0 ? 'bg-red-50' : 'bg-red-100'} hover:bg-red-200 transition-colors`}
                    >
                            <td className="px-4 py-2 flex items-center font-medium text-red-900">
                              <span className="text-2xl mr-2">{getViolationIcon(type)}</span>
                              <span className="capitalize mr-2">{type.replace('_', ' ')}</span>
                              <span className="ml-auto bg-red-200 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                                {type === 'fullscreen_exit' && fullscreenExitCount !== null
                                  ? fullscreenExitCount
                                  : type === 'tab_switch' && tabSwitchCount !== null
                                    ? tabSwitchCount
                                    : v.timestamps.length}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-red-700 max-w-xs truncate" title={v.details}>{v.details}</td>
                            <td className="px-4 py-2 text-xs text-red-600 max-w-xs overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-red-300 scrollbar-track-red-100" style={{maxWidth: '220px'}} title={v.timestamps.map(ts => formatTimestamp(ts)).join(', ')}>
                              {type === 'fullscreen_exit' || type === 'tab_switch'
                                ? '' // No timestamps for fullscreen exit or tab switch
                                : v.timestamps.map(ts => formatTimestamp(ts)).join(', ')}
                            </td>
                            <td className="px-4 py-2 text-xs text-red-700 font-semibold">{Math.round(v.confidence * 100)}%</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
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
