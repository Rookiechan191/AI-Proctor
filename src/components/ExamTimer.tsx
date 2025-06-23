import React, { useState, useEffect, useCallback } from 'react';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface ExamTimerProps {
  duration: number; // Duration in minutes
  onTimeUp: () => void;
  onWarning?: (timeLeft: number) => void;
  className?: string;
}

const ExamTimer: React.FC<ExamTimerProps> = ({ 
  duration, 
  onTimeUp, 
  onWarning,
  className = "" 
}) => {
  const [timeLeft, setTimeLeft] = useState(duration * 60); // Convert to seconds
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getTimerColor = useCallback((seconds: number) => {
    if (seconds <= 300) return 'text-red-600'; // Last 5 minutes
    if (seconds <= 600) return 'text-orange-600'; // Last 10 minutes
    if (seconds <= 1800) return 'text-yellow-600'; // Last 30 minutes
    return 'text-green-600';
  }, []);

  const getTimerBgColor = useCallback((seconds: number) => {
    if (seconds <= 300) return 'bg-red-100 border-red-300'; // Last 5 minutes
    if (seconds <= 600) return 'bg-orange-100 border-orange-300'; // Last 10 minutes
    if (seconds <= 1800) return 'bg-yellow-100 border-yellow-300'; // Last 30 minutes
    return 'bg-green-100 border-green-300';
  }, []);

  const getTimerIcon = useCallback((seconds: number) => {
    if (seconds <= 300) return <AlertTriangle className="w-5 h-5 text-red-600" />;
    if (seconds <= 600) return <AlertTriangle className="w-5 h-5 text-orange-600" />;
    if (seconds <= 1800) return <Clock className="w-5 h-5 text-yellow-600" />;
    return <Clock className="w-5 h-5 text-green-600" />;
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        
        // Trigger warnings
        if (newTime === 300 && onWarning) { // 5 minutes left
          onWarning(5);
          setIsCritical(true);
        } else if (newTime === 600 && onWarning) { // 10 minutes left
          onWarning(10);
          setIsWarning(true);
        } else if (newTime === 1800 && onWarning) { // 30 minutes left
          onWarning(30);
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp, onWarning]);

  const getProgressPercentage = () => {
    const totalTime = duration * 60;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  const getProgressColor = () => {
    if (timeLeft <= 300) return 'bg-red-500'; // Last 5 minutes
    if (timeLeft <= 600) return 'bg-orange-500'; // Last 10 minutes
    if (timeLeft <= 1800) return 'bg-yellow-500'; // Last 30 minutes
    return 'bg-green-500';
  };

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 shadow-lg ${getTimerBgColor(timeLeft)}`}>
        {getTimerIcon(timeLeft)}
        
        <div className="text-center">
          <div className={`text-2xl font-bold ${getTimerColor(timeLeft)}`}>
            {formatTime(timeLeft)}
          </div>
          <div className="text-xs text-gray-600 font-medium">
            Time Remaining
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ease-out ${getProgressColor()}`}
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* Warning Messages */}
      {isCritical && (
        <div className="mt-2 bg-red-100 border border-red-300 rounded-lg p-3 animate-pulse">
          <div className="flex items-center gap-2 text-red-800 text-sm font-medium">
            <AlertTriangle className="w-4 h-4" />
            Critical: Only 5 minutes remaining!
          </div>
        </div>
      )}

      {isWarning && !isCritical && (
        <div className="mt-2 bg-orange-100 border border-orange-300 rounded-lg p-3">
          <div className="flex items-center gap-2 text-orange-800 text-sm font-medium">
            <AlertTriangle className="w-4 h-4" />
            Warning: Only 10 minutes remaining!
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamTimer; 