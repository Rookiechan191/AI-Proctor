import React, { useEffect, useState, useRef } from 'react';
import { CameraIcon, RefreshCwIcon, Loader2Icon, AlertCircleIcon } from 'lucide-react';
type FaceCaptureProps = {
  onCapture: (image: string) => void;
  viewType: string;
};
export const FaceCapture: React.FC<FaceCaptureProps> = ({
  onCapture,
  viewType
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      setError(null);
      setLoading(true);
      try {
        if (isCapturing) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user'
            }
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        setError('Unable to access camera. Please check permissions.');
        setIsCapturing(false);
      } finally {
        setLoading(false);
      }
    };
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCapturing]);
  useEffect(() => {
    setCapturedImage(null);
    setIsCapturing(true);
    setError(null);
  }, [viewType]);
  const startCapture = () => {
    setCapturedImage(null);
    setError(null);
    setIsCapturing(true);
  };
  const captureImage = () => {
    setLoading(true);
    setTimeout(() => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = canvas.toDataURL('image/png');
          setCapturedImage(imageData);
          setIsCapturing(false);
        }
      }
      setLoading(false);
    }, 500);
  };
  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      if (capturedImage) {
        onCapture(capturedImage);
      }
      setLoading(false);
    }, 500);
  };
  const retakePhoto = () => {
    setCapturedImage(null);
    setError(null);
    setIsCapturing(true);
  };
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-md aspect-[4/3] bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-lg overflow-hidden transition-all duration-300">
        {isCapturing ? (
          <>
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover animate-fadein" />
            <div className="absolute inset-0 pointer-events-none">
              {viewType === 'front' && (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="border-4 border-dashed border-white/80 w-3/5 h-4/5 rounded-full opacity-80 animate-pulse"></div>
                </div>
              )}
              {viewType === 'left' && (
                <div className="w-full h-full flex items-center">
                  <div className="border-4 border-dashed border-white/80 w-2/5 h-4/5 rounded-full opacity-80 ml-auto mr-8 animate-pulse"></div>
                </div>
              )}
              {viewType === 'right' && (
                <div className="w-full h-full flex items-center">
                  <div className="border-4 border-dashed border-white/80 w-2/5 h-4/5 rounded-full opacity-80 ml-8 animate-pulse"></div>
                </div>
              )}
            </div>
          </>
        ) : capturedImage ? (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover animate-fadein" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800 animate-fadein">
            <CameraIcon className="h-16 w-16 text-gray-400" />
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10 animate-fadein">
            <Loader2Icon className="h-10 w-10 text-white animate-spin" aria-label="Loading" />
          </div>
        )}
        {error && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg flex items-center gap-2 shadow animate-fadein">
            <AlertCircleIcon className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <div className="mt-4 flex gap-3 w-full max-w-md">
        {!isCapturing && !capturedImage && (
          <button
            onClick={startCapture}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            aria-label="Start Camera"
            disabled={loading}
          >
            <CameraIcon className="inline-block mr-2 h-5 w-5" /> Start Camera
          </button>
        )}
        {isCapturing && (
          <button
            onClick={captureImage}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 flex items-center justify-center gap-2"
            aria-label="Capture Photo"
            disabled={loading}
          >
            {loading ? <Loader2Icon className="h-5 w-5 animate-spin" /> : <CameraIcon className="h-5 w-5" />} Capture Photo
          </button>
        )}
        {capturedImage && (
          <>
            <button
              onClick={retakePhoto}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg shadow hover:bg-gray-300 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              aria-label="Retake Photo"
              disabled={loading}
            >
              <RefreshCwIcon className="h-4 w-4" /> Retake
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
              aria-label="Accept and Continue"
              disabled={loading}
            >
              {loading ? <Loader2Icon className="h-5 w-5 animate-spin" /> : null} Accept & Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}; 