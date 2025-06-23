import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { SignIn } from './components/SignIn';
import Quiz from './pages/Quiz';
import Results from './pages/Results';
import ExamDetails from './pages/ExamDetails';
import FaceRecognition from './pages/FaceRecognition';

function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
      </main>
    </>
  );
}

export function App() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-white">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/exam-details" element={<ExamDetails />} />
        <Route path="/face-recognition" element={<FaceRecognition />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </div>
  );
}
