import React from 'react';
import { CheckIcon, StarIcon, ShieldCheck, Eye } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export function Hero() {
  const navigate = useNavigate();

  return <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Secure Online Exams with Advanced AI Proctoring
          </h1>
          <p className="text-lg text-gray-700">
            Transform your online assessments with our state-of-the-art AI proctoring solution. 
            Prevent cheating, ensure exam integrity, and maintain academic honesty with real-time 
            monitoring and advanced behavior analysis.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm border border-gray-100">
              <Eye className="h-8 w-8 text-emerald-500 mb-2" />
              <h3 className="font-semibold text-gray-800">Real-time Monitoring</h3>
              <p className="text-sm text-gray-600 text-center">Live video and audio analysis</p>
            </div>
            <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm border border-gray-100">
              <ShieldCheck className="h-8 w-8 text-emerald-500 mb-2" />
              <h3 className="font-semibold text-gray-800">Secure Platform</h3>
              <p className="text-sm text-gray-600 text-center">End-to-end encryption</p>
            </div>
          </div>
          <div className="flex justify-center">
            <Link
              to="/signin"
              className="rounded-md bg-emerald-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              Sign in
            </Link>
          </div>
          <div className="pt-4">
            <p className="text-gray-700 text-center">
              A Product by{' '}
              <span className="text-emerald-500 font-medium">
                BlackBucks
              </span>
              {' '}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2 justify-center">
            <div className="flex items-center gap-2">
            </div>
            <div className="flex items-center gap-1">
              <div className="flex">
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          <img src="/interview.jpg" alt="AI Proctoring System in Action" className="w-full h-auto" />
        </div>
      </div>
    </div>;
}