import React, { useEffect, useRef, useState } from 'react';

// Types for detection results
interface DetectionResult {
  multiple_faces: boolean;
  looking_away: boolean;
  head_turning: boolean;
  device_detected: boolean;
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
              body: JSON.stringify({ image: imageData }),
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

    startWebcam();

    // Cleanup function
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        setIsActive(false);
      }
    };
  }, []);

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