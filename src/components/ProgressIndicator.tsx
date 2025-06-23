import React, { Fragment } from 'react';
import { CheckIcon } from 'lucide-react';
type Step = {
  id: string;
  title: string;
};
type ProgressIndicatorProps = {
  steps: Step[];
  currentStep: number;
  completedSteps: string[];
};
export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep,
  completedSteps
}) => {
  return (
    <div className="flex justify-between items-center w-full">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id);
        const isActive = index === currentStep;
        return (
          <Fragment key={step.id}>
            {/* Step indicator */}
            <div className="flex flex-col items-center relative">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : isActive
                    ? 'border-blue-500 text-blue-500'
                    : 'border-gray-300 text-gray-400'
                }`}
              >
                {isCompleted ? <CheckIcon className="h-5 w-5" /> : <span>{index + 1}</span>}
              </div>
              <span
                className={`mt-2 text-sm font-medium ${
                  isActive
                    ? 'text-blue-600'
                    : isCompleted
                    ? 'text-green-600'
                    : 'text-gray-500'
                }`}
              >
                {step.title}
              </span>
            </div>
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2 h-0.5 bg-gray-200">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: isCompleted ? '100%' : '0%' }}
                />
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}; 