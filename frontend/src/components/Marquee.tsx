"use client";

import React from 'react';

interface MarqueeProps {
  children: React.ReactNode;
  vertical?: boolean;
  reverse?: boolean;
  pauseOnHover?: boolean;
  className?: string;
  repeat?: number;
}

export function Marquee({
  children,
  vertical = false,
  reverse = false,
  pauseOnHover = false,
  className = "",
  repeat = 4,
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      className={`group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)] ${
        vertical ? "flex-col" : "flex-row"
      } ${className}`}
    >
      {Array(repeat)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className={`flex shrink-0 justify-around [gap:var(--gap)] ${
              vertical ? "flex-col" : "flex-row"
            } ${reverse ? "animate-marquee-reverse" : "animate-marquee"} ${
              pauseOnHover ? "group-hover:[animation-play-state:paused]" : ""
            }`}
          >
            {children}
          </div>
        ))}
    </div>
  );
}
