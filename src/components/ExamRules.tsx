import React from 'react';
import { AlertTriangle, CheckCircle, Clock, Camera, Monitor, Users, Eye, Shield } from 'lucide-react';

interface ExamRulesProps {
  onAccept: () => void;
  examTitle?: string;
  examDuration?: number;
}

const ExamRules: React.FC<ExamRulesProps> = ({ onAccept, examTitle = "Online Exam", examDuration = 60 }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{examTitle}</h1>
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Clock className="w-5 h-5" />
              <span className="font-medium">Duration: {examDuration} minutes</span>
            </div>
          </div>

          {/* Rules Section */}
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600" />
                Exam Rules & Guidelines
              </h2>
              <p className="text-gray-600">
                Please read all rules carefully. Violation of any rule may result in exam disqualification.
              </p>
            </div>

            {/* Rules Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Identity Verification */}
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="flex items-start gap-3 mb-3">
                  <Camera className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Identity Verification</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• You must be the registered student taking this exam</li>
                      <li>• Face verification will be active throughout the exam</li>
                      <li>• Ensure your face is clearly visible to the camera</li>
                      <li>• Do not allow others to take the exam on your behalf</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Camera & Environment */}
              <div className="bg-green-50 rounded-lg p-6">
                <div className="flex items-start gap-3 mb-3">
                  <Monitor className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Camera & Environment</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Ensure good lighting in your room</li>
                      <li>• Keep your face centered in the camera view</li>
                      <li>• Avoid looking away from the screen for extended periods</li>
                      <li>• Do not use multiple devices or screens</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Behavior Rules */}
              <div className="bg-yellow-50 rounded-lg p-6">
                <div className="flex items-start gap-3 mb-3">
                  <Eye className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Behavior Rules</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Do not switch browser tabs or windows</li>
                      <li>• Do not use external devices or materials</li>
                      <li>• Do not communicate with others during the exam</li>
                      <li>• Do not take screenshots or record the exam</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Technical Requirements */}
              <div className="bg-purple-50 rounded-lg p-6">
                <div className="flex items-start gap-3 mb-3">
                  <Users className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Technical Requirements</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Stable internet connection required</li>
                      <li>• Allow camera and microphone permissions</li>
                      <li>• Do not refresh or close the browser</li>
                      <li>• Keep the exam window active and visible</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Warnings */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-2">Important Warnings</h3>
                  <ul className="text-sm text-red-800 space-y-1">
                    <li>• <strong>Multiple faces detected:</strong> Only you should be visible to the camera</li>
                    <li>• <strong>Looking away:</strong> Keep your attention on the exam screen</li>
                    <li>• <strong>Device detection:</strong> Do not use phones or tablets during the exam</li>
                    <li>• <strong>Proxy detection:</strong> You must be the registered student</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Consequences */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Consequences of Violations</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-white rounded border">
                  <div className="text-yellow-600 font-semibold mb-1">Warning</div>
                  <div className="text-gray-600">First violation</div>
                </div>
                <div className="text-center p-3 bg-white rounded border">
                  <div className="text-orange-600 font-semibold mb-1">Flagged</div>
                  <div className="text-gray-600">Multiple violations</div>
                </div>
                <div className="text-center p-3 bg-white rounded border">
                  <div className="text-red-600 font-semibold mb-1">Disqualified</div>
                  <div className="text-gray-600">Serious violations</div>
                </div>
              </div>
            </div>
          </div>

          {/* Acceptance Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center gap-3 mb-6">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span className="text-gray-700 font-medium">
                I have read and understood all the exam rules and guidelines
              </span>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={onAccept}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                I Accept & Start Exam
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamRules; 