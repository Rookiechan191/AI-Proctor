import React from 'react';
import { GlobeIcon, PhoneIcon, MessageSquareIcon, ChevronDownIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function Header() {
  const navigate = useNavigate();

  return <header className="w-full bg-white border-b border-gray-100">
      <div className="container mx-auto px-4">
        {/* Top header */}
        <div className="flex items-center justify-between py-2 border-b border-gray-100 text-sm">
          <div className="flex items-center gap-1">
            <GlobeIcon className="h-4 w-4" />
            <span>EN</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <button className="flex items-center gap-1 text-gray-600">
              <span>Support</span>
            </button>
            <a href="tel:+18447558378" className="flex items-center gap-1 text-gray-600">
              <PhoneIcon className="h-4 w-4" />
              <span>+1 (844) 755 8378</span>
            </a>
            <button className="flex items-center gap-1 text-gray-600">
              <MessageSquareIcon className="h-4 w-4" />
              <span>Live chat</span>
            </button>
          </div>
        </div>
        {/* Main navigation */}
        <nav className="flex items-center justify-between py-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="h-12 flex items-center">
              <span className="text-2xl font-bold text-emerald-600">AI Proctor</span>
            </Link>
            <div className="hidden lg:flex items-center gap-6">
              <div className="flex items-center gap-1 cursor-pointer">
                <span>Resources</span>
                <ChevronDownIcon className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1 cursor-pointer">
                <span>About</span>
                <ChevronDownIcon className="h-4 w-4" />
              </div>
              <div className="text-xl font-semibold text-gray-800 ml-4">
                Advanced AI Exam Monitoring
              </div>
            </div>
          </div>
          <button onClick={() => navigate('/signin')} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-md">
            Sign in
          </button>
        </nav>
      </div>
    </header>;
}