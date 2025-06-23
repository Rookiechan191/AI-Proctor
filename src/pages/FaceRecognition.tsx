import React, { useState } from 'react';
import { FaceCapture } from '../components/FaceCapture';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { Instructions } from '../components/Instructions';
import { CheckCircleIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
const CAPTURE_STEPS = [{
  id: 'front',
  title: 'Front View',
  instruction: 'Position your face in the center of the frame, looking directly at the camera.'
}, {
  id: 'left',
  title: 'Left Side View',
  instruction: 'Turn your head to the right, showing the left side of your face to the camera.'
}, {
  id: 'right',
  title: 'Right Side View',
  instruction: 'Turn your head to the left, showing the right side of your face to the camera.'
}];
const FaceRecognition: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [capturedImages, setCapturedImages] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);
  const navigate = useNavigate();
  const handleCapture = async (image: string) => {
    const step = CAPTURE_STEPS[currentStep];
    setCapturedImages(prev => ({
      ...prev,
      [step.id]: image
    }));
    
    // Upload image to backend
    try {
      const studentId = localStorage.getItem('studentId') || 'unknown';
      const response = await fetch('http://localhost:5000/upload_face_image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: image,
          student_id: studentId,
          view_type: step.id
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Image uploaded successfully:', data);
      } else {
        console.error('Failed to upload image');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
    }
    
    if (currentStep < CAPTURE_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCompleted(true);
    }
  };
  const resetProcess = () => {
    setCurrentStep(0);
    setCapturedImages({});
    setCompleted(false);
  };
  return <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Face Recognition Setup
        </h1>
        <p className="text-gray-600 mt-2">
          Please complete all three facial scans for proper identification
        </p>
      </header>
      <ProgressIndicator steps={CAPTURE_STEPS} currentStep={currentStep} completedSteps={Object.keys(capturedImages)} />
      <div className="mt-8">
        {!completed ? <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {CAPTURE_STEPS[currentStep].title}
            </h2>
            <Instructions instruction={CAPTURE_STEPS[currentStep].instruction} step={CAPTURE_STEPS[currentStep].id} />
            <div className="mt-6">
              <FaceCapture onCapture={handleCapture} viewType={CAPTURE_STEPS[currentStep].id} />
            </div>
          </div> : <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircleIcon className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              All Scans Completed!
            </h2>
            <p className="text-gray-600 mb-6">
              Thank you for completing all required facial scans. Your identity
              has been verified.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {CAPTURE_STEPS.map(step => <div key={step.id} className="border border-gray-200 rounded-lg p-2">
                  <h3 className="font-medium text-gray-700 mb-2">
                    {step.title}
                  </h3>
                  {capturedImages[step.id] && <img src={capturedImages[step.id]} alt={`Captured ${step.title}`} className="w-full h-32 object-cover rounded" />}
                </div>)}
            </div>
            <button onClick={resetProcess} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Start Again
            </button>
            <button onClick={() => navigate('/quiz')} className="ml-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Start Exam
            </button>
          </div>}
      </div>
    </div>;
};
export default FaceRecognition; 