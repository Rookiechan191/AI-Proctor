import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

// ProctorDetector class for video proctoring
class ProctorDetector {
  violations: {
    multiple_faces: boolean;
    looking_away: boolean;
    head_turning: boolean;
    device_detected: boolean;
  };

  constructor() {
    this.violations = {
      multiple_faces: false,
      looking_away: false,
      head_turning: false,
      device_detected: false
    };
  }

  detectViolations(frame: any) {
    // Simulate detection logic (replace with actual MediaPipe and YOLO logic)
    const violations = {
      multiple_faces: false,
      looking_away: false,
      head_turning: false,
      device_detected: false
    };

    // Simulate face detection (replace with actual face detection logic)
    const faceCount = Math.floor(Math.random() * 3); // Simulate 0-2 faces
    if (faceCount > 1) {
      violations.multiple_faces = true;
    }

    // Simulate head pose detection (replace with actual head pose logic)
    const pitch = Math.random() * 40 - 20; // Simulate pitch between -20 and 20
    const yaw = Math.random() * 60 - 30; // Simulate yaw between -30 and 30
    if (Math.abs(yaw) > 30 || Math.abs(pitch) > 20) {
      violations.head_turning = true;
    }

    // Simulate looking away detection (replace with actual looking away logic)
    const avgEar = Math.random() * 0.5; // Simulate average EAR between 0 and 0.5
    if (avgEar < 0.2 || avgEar > 0.5) {
      violations.looking_away = true;
    }

    // Simulate device detection (replace with actual device detection logic)
    const deviceDetected = Math.random() > 0.8; // Simulate device detection
    if (deviceDetected) {
      violations.device_detected = true;
    }

    return violations;
  }
}

const WebcamFeed: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>('');
  const [sessionId, setSessionId] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const proctorDetector = useRef(new ProctorDetector());

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
        }
        // Start capturing frames once webcam is active
        setTimeout(captureFrame, 1000); // Delay to ensure video is loaded
      } catch (err) {
        setError('Unable to access webcam. Please ensure you have granted camera permissions.');
        console.error('Webcam error:', err);
      }
    };

    const captureFrame = () => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frameData = canvas.toDataURL('image/jpeg', 0.5);
          sendFrameToBackend(frameData);
        }
      }
      setTimeout(captureFrame, 5000); // Capture every 5 seconds
    };

    const sendFrameToBackend = async (frameData: string) => {
      if (!sessionId) return;
      try {
        const response = await axios.post(`http://localhost:8000/sessions/${sessionId}/process-frame`, {
          frame_data: frameData
        });
        // Assuming the backend returns violations
        const violations = response.data.violations;
        if (violations && violations.length > 0) {
          console.log('Violations detected:', violations);
          // Optionally, you can update a state or context to display violations in real-time
        }
      } catch (err) {
        console.error('Error sending frame to backend:', err);
      }
    };

    startWebcam();
    
    // Initialize or retrieve session ID (this could be passed as a prop or managed via context)
    // For now, we'll assume it's set externally or hardcoded for demo
    if (!sessionId) {
      setSessionId(1); // Placeholder: Replace with actual session creation logic
    }

    // Cleanup function
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
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
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="rounded-lg shadow-lg w-[240px] h-[180px] bg-gray-900 object-cover"
            />
            <div className="absolute top-2 right-2 bg-red-600 w-3 h-3 rounded-full animate-pulse" />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-xs">
              Live Camera
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </>
        )}
      </div>
    </div>
  );
};

export default WebcamFeed;
