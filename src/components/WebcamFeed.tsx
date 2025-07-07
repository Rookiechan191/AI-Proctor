import React, { useEffect, useRef, useState } from 'react';

// Types for detection results
interface DetectionResult {
  multiple_faces: boolean;
  looking_away: boolean;
  head_turning: boolean;
  device_detected: boolean;
  person_disappeared: boolean;
  identity_mismatch: boolean;
  multiple_people: boolean;
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

interface HybridVerificationResult {
  person_tracked: boolean;
  face_verification_triggered: boolean;
  identity_verified: boolean | null;
  message: string;
}

const WebcamFeed: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string>('');
  const [isActive, setIsActive] = useState(false);
  const [violations, setViolations] = useState<DetectionResult>({
    multiple_faces: false,
    looking_away: false,
    head_turning: false,
    device_detected: false,
    person_disappeared: false,
    identity_mismatch: false,
    multiple_people: false
  });
  const [faceVerification, setFaceVerification] = useState<FaceVerificationResult | null>(null);
  const [hybridVerification, setHybridVerification] = useState<HybridVerificationResult | null>(null);
  const [trackedPersonId, setTrackedPersonId] = useState<string | null>(null);
  const [verificationInterval, setVerificationInterval] = useState<NodeJS.Timeout | null>(null);
  const [proxyViolationReported, setProxyViolationReported] = useState<boolean>(false);
  const [violationTimeout, setViolationTimeout] = useState<NodeJS.Timeout | null>(null);
  const [detectionBoxes, setDetectionBoxes] = useState<{persons: any[], faces: any[]}>({persons: [], faces: []});

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
          startHybridAnalysis();
        }
      } catch (err) {
        setError('Unable to access webcam. Please ensure you have granted camera permissions.');
        console.error('Webcam error:', err);
      }
    };

    const startHybridAnalysis = () => {
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
            // Send frame to backend for hybrid analysis
            const response = await fetch('http://localhost:5000/hybrid_analyze', {
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
                setHybridVerification(data.verification);
                setTrackedPersonId(data.tracked_person_id);
                
                // Store detection boxes for drawing
                if (data.detection_boxes) {
                  setDetectionBoxes(data.detection_boxes);
                }
                
                // Handle face verification results
                if (data.verification.face_verification_triggered) {
                  if (data.verification.identity_verified === false) {
                    setFaceVerification({
                      success: true,
                      verified: false,
                      message: 'Identity verification failed - different person detected'
                    });
                    reportProxyViolation('Identity mismatch detected during hybrid verification');
                  } else if (data.verification.identity_verified === true) {
                    setFaceVerification({
                      success: true,
                      verified: true,
                      message: 'Identity verified - same person confirmed'
                    });
                    // Reset violation state when verification passes
                    setProxyViolationReported(false);
                    console.log('Identity verified - resetting violation state');
                  }
                }
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
      
      // Clear any existing timeout
      if (violationTimeout) {
        clearTimeout(violationTimeout);
        setViolationTimeout(null);
      }
      
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
      if (violationTimeout) {
        clearTimeout(violationTimeout);
      }
    };
  }, [proxyViolationReported]);

  // Draw detection boxes on overlay canvas
  useEffect(() => {
    const drawDetectionBoxes = () => {
      const overlayCanvas = overlayCanvasRef.current;
      const video = videoRef.current;
      if (!overlayCanvas || !video) return;

      const ctx = overlayCanvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size to match video
      overlayCanvas.width = video.videoWidth;
      overlayCanvas.height = video.videoHeight;

      // Clear previous drawings
      ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

      // Draw person boxes (blue)
      detectionBoxes.persons.forEach((person: any) => {
        const [x1, y1, x2, y2] = person.bbox;
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        ctx.fillStyle = '#3B82F6';
        ctx.font = '12px Arial';
        ctx.fillText('Person', x1, y1 - 5);
      });

      // Draw face boxes (green)
      detectionBoxes.faces.forEach((face: any) => {
        const [x1, y1, x2, y2] = face.bbox;
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        ctx.fillStyle = '#10B981';
        ctx.font = '12px Arial';
        ctx.fillText('Face', x1, y1 - 5);
      });
    };

    drawDetectionBoxes();
  }, [detectionBoxes]);

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="relative">
        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg shadow-lg text-sm">
            {error}
          </div>
        ) : (
          <>
            {/* Unified Status Indicator */}
            <div className="mb-2">
              <div className="bg-gray-800 text-white px-3 py-2 rounded text-sm font-medium">
                {trackedPersonId ? (
                  <div className="flex items-center justify-between">
                    <span>🟢 Active Monitoring</span>
                    <span className="text-xs opacity-75">ID: {trackedPersonId}</span>
                  </div>
                ) : (
                  <span>⏳ Initializing...</span>
                )}
              </div>
            </div>

            {/* Violation Indicators - Only show when violations occur */}
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
              {violations.person_disappeared && (
                <div className="bg-orange-500 text-white px-3 py-1.5 rounded text-sm font-medium">
                  Person Left Camera View
                </div>
              )}
              {violations.identity_mismatch && (
                <div className="bg-red-600 text-white px-3 py-1.5 rounded text-sm font-medium">
                  Identity Mismatch Detected
                </div>
              )}
              {violations.multiple_people && (
                <div className="bg-red-500 text-white px-3 py-1.5 rounded text-sm font-medium">
                  Multiple People Detected
                </div>
              )}
              
              {/* Identity Verification Status - Only show when verification happens */}
              {hybridVerification?.face_verification_triggered && (
                <div className={`px-3 py-1.5 rounded text-sm font-medium ${
                  hybridVerification.identity_verified === true
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {hybridVerification.identity_verified === true 
                    ? '✅ Identity Verified' 
                    : '❌ Identity Verification Failed'
                  }
                </div>
              )}
              
              {/* Proxy Detection Warning */}
              {proxyViolationReported && (
                <div className="bg-red-700 text-white px-3 py-1.5 rounded text-sm font-bold animate-pulse">
                  ⚠️ Security Violation Reported
                </div>
              )}
            </div>
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="rounded-lg shadow-lg w-[240px] h-[180px] bg-gray-900 object-cover"
              />
              <canvas 
                ref={overlayCanvasRef} 
                className="absolute top-0 left-0 w-full h-full pointer-events-none rounded-lg"
                style={{ width: '240px', height: '180px' }}
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
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WebcamFeed; 