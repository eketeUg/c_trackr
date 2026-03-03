"use client";

import React from 'react';
import GalaxyBackground from '@/components/GalaxyBackground';

export default function Blocker() {
  return (
    <main className="min-h-screen text-white font-sans relative flex flex-col items-center justify-center overflow-hidden">
      <GalaxyBackground />
      
      <div className="relative z-10 flex flex-col items-center text-center p-10 bg-black/50 backdrop-blur-xl rounded-3xl border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.15)] max-w-lg w-full mx-4">
        <div className="mb-8 p-5 rounded-full bg-gradient-to-br from-red-500/20 to-red-900/40 text-red-400 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h1 className="text-3xl md:text-3xl font-semibold mb-4 tracking-wide drop-shadow-lg text-white/90">
          Service Suspended
        </h1>
        
        <p className="text-base md:text-lg text-gray-400 max-w-md leading-relaxed font-light px-4">
          Contact the developer to wake service
        </p>
        
        <div className="w-full h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent mt-8 mb-2"></div>
      </div>
    </main>
  );
}
