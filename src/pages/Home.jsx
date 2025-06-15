import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 100);

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(timer);
          navigate("/login");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-oceanblue via-fog to-tumbleweed">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Orbs */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-tumbleweed/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-white/10 rounded-full blur-lg animate-bounce" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-fog/15 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-moderatelybrown/15 rounded-full blur-xl animate-bounce" style={{animationDelay: '0.5s'}}></div>
        
        {/* Geometric Shapes */}
        <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-white/40 rotate-45 animate-spin" style={{animationDuration: '3s'}}></div>
        <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-tumbleweed/60 rotate-45 animate-spin" style={{animationDuration: '4s', animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/6 w-1 h-1 bg-white/50 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-oceanblue/50 to-transparent"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className={`text-center transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          
          {/* Logo/Brand Section */}
          <div className="mb-8">
            <div className="relative inline-block">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-tumbleweed to-fog rounded-full shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              {/* Pulsing Ring */}
              <div className="absolute inset-0 w-24 h-24 mx-auto border-2 border-white/30 rounded-full animate-ping"></div>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="space-y-4 mb-12">
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
              <span className="inline-block animate-fade-in-up">Welcome</span>
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-tumbleweed to-fog mx-auto rounded-full opacity-80"></div>
            <p className="text-xl md:text-2xl text-white/80 font-light max-w-2xl mx-auto leading-relaxed">
              Experience something extraordinary
            </p>
          </div>

          {/* Countdown Section */}
          <div className="space-y-6">
            {/* Circular Progress */}
            <div className="relative inline-block">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="white"
                  strokeOpacity="0.2"
                  strokeWidth="4"
                  fill="none"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="url(#gradient)"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (countdown / 3)}`}
                  className="transition-all duration-1000 ease-linear"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#21A179" />
                    <stop offset="100%" stopColor="#6A8DA6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {countdown}
                </span>
              </div>
            </div>

            {/* Loading Text */}
            <div className="space-y-2">
              <p className="text-white/70 text-lg">
                Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}
              </p>
              
              {/* Animated Dots */}
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-tumbleweed rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-fog rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-12 max-w-md mx-auto">
            <div className="h-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
              <div 
                className="h-full bg-gradient-to-r from-tumbleweed to-fog rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${((3 - countdown) / 3) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-oceanblue/80 to-transparent"></div>
      
      {/* Custom CSS for additional animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Home;