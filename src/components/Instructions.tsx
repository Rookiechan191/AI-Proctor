import React from 'react';
import { AlertCircleIcon } from 'lucide-react';
type InstructionsProps = {
  instruction: string;
  step: string;
};
export const Instructions: React.FC<InstructionsProps> = ({
  instruction,
  step
}) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
      <div className="text-blue-500 flex-shrink-0">
        <AlertCircleIcon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-blue-800">{instruction}</p>
        {step === 'front' && (
          <p className="text-blue-600 text-sm mt-1">
            Look directly at the camera and ensure your entire face is visible.
          </p>
        )}
        {step === 'left' && (
          <p className="text-blue-600 text-sm mt-1">
            Turn your head to the right at approximately 90 degrees.
          </p>
        )}
        {step === 'right' && (
          <p className="text-blue-600 text-sm mt-1">
            Turn your head to the left at approximately 90 degrees.
          </p>
        )}
      </div>
    </div>
  );
}; 