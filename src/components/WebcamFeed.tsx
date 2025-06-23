import React, { useEffect, useRef, useState } from 'react';

// Types for detection results
interface DetectionResult {
  multiple_faces: boolean;
  looking_away: boolean;
  head_turning: boolean;
  device_detected: boolean;
}

interface FaceVerificationResult {
  success: boolean;
  verified: boolean;
  match_count?: number;
  total_references?: number;
  average_distance?: number;
  error?: string;
  message?: string;
}

const WebcamFeed: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string>('');
  const [isActive, setIsActive] = useState(false);
  const [violations, setViolations] = useState<DetectionResult>({
    multiple_faces: false,
    looking_away: false,
    head_turning: false,
    device_detected: false
  });
  const [faceVerification, setFaceVerification] = useState<FaceVerificationResult | null>(null);
  const [verificationInterval, setVerificationInterval] = useState<NodeJS.Timeout | null>(null);
  const [proxyViolationReported, setProxyViolationReported] = useState<boolean>(false);

  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
            facingMode: 'user'
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsActive(true);
          startAnalysis();
          startFaceVerification();
        }
      } catch (err) {
        setError('Unable to access webcam. Please ensure you have granted camera permissions.');
        console.error('Webcam error:', err);
      }
    };

    const startAnalysis = () => {
      const analyzeFrame = async () => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          // Draw current frame to canvas
          const canvas = canvasRef.current;
          if (!canvas) return;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          ctx.drawImage(videoRef.current, 0, 0);

          // Convert canvas to base64
          const imageData = canvas.toDataURL('image/jpeg', 0.8);

          try {
            // Send frame to backend for analysis
            const response = await fetch('http://localhost:5000/analyze_frame', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                image: imageData,
                student_id: localStorage.getItem('studentId'),
                exam_id: localStorage.getItem('examId')
              }),
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                setViolations(data.violations);
              }
            }
          } catch (err) {
            console.error('Error analyzing frame:', err);
          }
        }
        requestAnimationFrame(analyzeFrame);
      };
      requestAnimationFrame(analyzeFrame);
    };

    const reportProxyViolation = async (details: string) => {
      console.log('reportProxyViolation called with details:', details);
      if (proxyViolationReported) {
        console.log('Proxy violation already reported, skipping...');
        return;
      }
      console.log('Setting proxyViolationReported to true and reporting...');
      setProxyViolationReported(true);
      const studentId = localStorage.getItem('studentId');
      const examId = localStorage.getItem('examId');
      console.log('Reporting proxy violation for student:', studentId, 'exam:', examId);
      try {
        const response = await fetch('http://localhost:5000/report_violation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            student_id: studentId,
            exam_id: examId,
            violation_type: 'proxy_detected',
            details: details || 'Face verification failed: possible proxy detected',
            confidence: 1.0
          }),
        });
        
        if (response.ok) {
          console.log('Proxy violation reported successfully');
        } else {
          console.error('Failed to report proxy violation:', response.status);
        }
      } catch (err) {
        console.error('Error reporting proxy violation:', err);
      }
    };

    const startFaceVerification = () => {
      // Perform face verification every 3 seconds
      const interval = setInterval(async () => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          const canvas = canvasRef.current;
          if (!canvas) return;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          ctx.drawImage(videoRef.current, 0, 0);

          const imageData = canvas.toDataURL('image/jpeg', 0.8);
          const studentId = localStorage.getItem('studentId');

          if (studentId) {
            try {
              const response = await fetch('http://localhost:5000/verify_face', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  student_id: studentId,
                  image: imageData
                }),
              });

              if (response.ok) {
                const result = await response.json();
                console.log('Face verification result:', result);
                setFaceVerification(result);
                
                // Check if verification failed (proxy detected)
                if (result && result.success === true && result.verified === false) {
                  console.log('Proxy detected! Reporting violation...');
                  reportProxyViolation(result.error || 'Face verification failed: possible proxy detected');
                } else if (result && result.success === false) {
                  console.log('Face verification failed with error:', result.error);
                  reportProxyViolation(result.error || 'Face verification failed: possible proxy detected');
                }
              }
            } catch (err) {
              console.error('Error verifying face:', err);
            }
          }
        }
      }, 3000); // Check every 3 seconds

      setVerificationInterval(interval);
    };

    startWebcam();

    // Cleanup function
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        setIsActive(false);
      }
      if (verificationInterval) {
        clearInterval(verificationInterval);
      }
    };
  }, [proxyViolationReported]);

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="relative">
        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg shadow-lg text-sm">
            {error}
          </div>
        ) : (
          <>
            {/* Violation Indicators - Now above the camera feed */}
            <div className="mb-2 space-y-1">
              {violations.multiple_faces && (
                <div className="bg-red-500 text-white px-3 py-1.5 rounded text-sm font-medium">
                  Multiple Faces Detected
                </div>
              )}
              {violations.head_turning && (
                <div className="bg-red-500 text-white px-3 py-1.5 rounded text-sm font-medium">
                  Head Rotation Detected
                </div>
              )}
              {violations.looking_away && (
                <div className="bg-red-500 text-white px-3 py-1.5 rounded text-sm font-medium">
                  Looking Away Detected
                </div>
              )}
              {violations.device_detected && (
                <div className="bg-red-500 text-white px-3 py-1.5 rounded text-sm font-medium">
                  Device Detected
                </div>
              )}
              
              {/* Face Verification Status */}
              {faceVerification && (
                <div className={`px-3 py-1.5 rounded text-sm font-medium ${
                  faceVerification.verified 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {faceVerification.verified 
                    ? faceVerification.message || 'Identity Verified'
                    : faceVerification.message || faceVerification.error || 'Identity Not Verified'
                  }
                </div>
              )}
              {proxyViolationReported && !faceVerification?.verified && (
                <div className="bg-red-700 text-white px-3 py-1.5 rounded text-sm font-bold animate-pulse">
                  Proxy Detected! This incident has been reported.
                </div>
              )}
            </div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="rounded-lg shadow-lg w-[240px] h-[180px] bg-gray-900 object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            {isActive && (
              <>
                <div className="absolute top-2 right-2 bg-red-600 w-3 h-3 rounded-full animate-pulse" />
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-xs">
                  Live Camera
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WebcamFeed; 