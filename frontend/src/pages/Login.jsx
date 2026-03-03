import React from 'react';
import LoginForm from '../components/LoginForm';

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Overlay for better text readability contrast if needed */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>

      {/* Main Container - Glassmorphism */}
      <div className="relative w-full max-w-4xl mx-4 bg-white/90 rounded-3xl shadow-2xl overflow-hidden border border-white/20">
        <div className="flex flex-col lg:flex-row">

          {/* Left side - Login Form */}
          <div className="w-full lg:w-1/2 p-8 md:p-10">
            <div className="h-full flex items-center">
              <div className="w-full">
                <LoginForm />
              </div>
            </div>
          </div>

          {/* Right side - Decorative Glass Panel */}
          <div className="hidden lg:flex w-full lg:w-1/2 items-center justify-center bg-transparent relative overflow-hidden">
            {/* Decorative circles or elements to make 'adapt' feel more real if needed, 
                 but keeping it clean as per user request to fit background. 
                 The background shows through this pane. */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="relative z-10 text-white p-8 text-center">
              <h2 className="text-3xl font-bold mb-4 drop-shadow-lg">Welcome Back</h2>
              <p className="text-white/90 drop-shadow-md">Enter your credentials to access the dashboard.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;