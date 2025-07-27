import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface RobotWritingAnimationProps {
  className?: string;
  autoPlay?: boolean;
  onComplete?: () => void;
}

export function RobotWritingAnimation({ 
  className, 
  autoPlay = true, 
  onComplete 
}: RobotWritingAnimationProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isPlaying && !isComplete) {
      const timer = setTimeout(() => {
        setIsComplete(true);
        onComplete?.();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, isComplete, onComplete]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setIsPlaying(true);
    setIsComplete(false);
  };

  return (
    <div className={cn("relative w-full max-w-2xl mx-auto", className)}>
      {/* Animation Container */}
      <div className="relative bg-card rounded-lg p-6 border shadow-sm">
        <svg
          viewBox="0 0 800 600"
          className="w-full h-auto"
          style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
        >
          {/* Background Desk */}
          <rect
            x="50"
            y="400"
            width="700"
            height="150"
            fill="hsl(var(--muted))"
            rx="8"
          />
          
          {/* Postcard */}
          <rect
            x="300"
            y="320"
            width="200"
            height="140"
            fill="hsl(var(--background))"
            stroke="hsl(var(--border))"
            strokeWidth="2"
            rx="4"
            className="postcard"
          />
          
          {/* Postcard Lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1="315"
              y1={340 + i * 20}
              x2="485"
              y2={340 + i * 20}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="1"
              opacity="0.3"
            />
          ))}
          
          {/* Robot Body */}
          <g className="robot-body">
            {/* Head */}
            <rect
              x="120"
              y="180"
              width="80"
              height="60"
              fill="hsl(var(--primary))"
              rx="8"
            />
            
            {/* Eyes */}
            <circle cx="140" cy="200" r="6" fill="hsl(var(--background))" />
            <circle cx="180" cy="200" r="6" fill="hsl(var(--background))" />
            <circle cx="140" cy="200" r="3" fill="hsl(var(--foreground))" />
            <circle cx="180" cy="200" r="3" fill="hsl(var(--foreground))" />
            
            {/* Mouth */}
            <rect x="155" y="215" width="10" height="4" fill="hsl(var(--background))" rx="2" />
            
            {/* Body */}
            <rect
              x="110"
              y="240"
              width="100"
              height="120"
              fill="hsl(var(--primary))"
              rx="12"
            />
            
            {/* Chest Panel */}
            <rect
              x="130"
              y="260"
              width="60"
              height="40"
              fill="hsl(var(--muted))"
              rx="4"
            />
            
            {/* Static Arm (Left) */}
            <rect
              x="90"
              y="260"
              width="20"
              height="60"
              fill="hsl(var(--primary))"
              rx="10"
            />
            
            {/* Animated Arm (Right) */}
            <g className={cn("robot-arm", isPlaying && "animate-writing")}>
              {/* Upper Arm */}
              <rect
                x="210"
                y="260"
                width="20"
                height="60"
                fill="hsl(var(--primary))"
                rx="10"
                style={{ transformOrigin: '220px 260px' }}
              />
              
              {/* Lower Arm */}
              <rect
                x="230"
                y="300"
                width="15"
                height="50"
                fill="hsl(var(--primary))"
                rx="7"
                style={{ transformOrigin: '220px 320px' }}
              />
              
              {/* Hand */}
              <circle
                cx="245"
                cy="340"
                r="8"
                fill="hsl(var(--primary))"
              />
              
              {/* Pen */}
              <line
                x1="245"
                y1="340"
                x2="260"
                y2="355"
                stroke="hsl(var(--foreground))"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
            
            {/* Legs */}
            <rect x="130" y="360" width="15" height="40" fill="hsl(var(--primary))" rx="7" />
            <rect x="175" y="360" width="15" height="40" fill="hsl(var(--primary))" rx="7" />
          </g>
          
          {/* Writing Text */}
          <g className="writing-text">
            <text
              x="320"
              y="355"
              fontSize="12"
              fill="hsl(var(--foreground))"
              fontFamily="cursive"
              className={cn("writing-line-1", isPlaying && "animate-write")}
            >
              Dear Friend,
            </text>
            <text
              x="320"
              y="375"
              fontSize="10"
              fill="hsl(var(--foreground))"
              fontFamily="cursive"
              className={cn("writing-line-2", isPlaying && "animate-write")}
            >
              Thank you for your
            </text>
            <text
              x="320"
              y="395"
              fontSize="10"
              fill="hsl(var(--foreground))"
              fontFamily="cursive"
              className={cn("writing-line-3", isPlaying && "animate-write")}
            >
              civic engagement!
            </text>
            <text
              x="320"
              y="415"
              fontSize="10"
              fill="hsl(var(--foreground))"
              fontFamily="cursive"
              className={cn("writing-line-4", isPlaying && "animate-write")}
            >
              Best regards,
            </text>
            <text
              x="320"
              y="435"
              fontSize="10"
              fill="hsl(var(--foreground))"
              fontFamily="cursive"
              className={cn("writing-line-5", isPlaying && "animate-write")}
            >
              🤖 Civic Bot
            </text>
          </g>
          
          {/* Completion Sparkles */}
          {isComplete && (
            <g className="completion-sparkles animate-fade-in">
              <circle cx="520" cy="340" r="3" fill="hsl(var(--primary))" className="animate-pulse" />
              <circle cx="530" cy="360" r="2" fill="hsl(var(--accent))" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
              <circle cx="540" cy="350" r="2.5" fill="hsl(var(--primary))" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
            </g>
          )}
        </svg>
      </div>
      
      {/* Controls */}
      <div className="flex justify-center gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePlayPause}
          className="flex items-center gap-2"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRestart}
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Restart
        </Button>
      </div>
      
      <style>{`
        .robot-arm.animate-writing {
          animation: robot-writing 8s ease-in-out infinite;
        }
        
        .writing-line-1.animate-write {
          animation: write-text 1.5s ease-out 1s both;
        }
        
        .writing-line-2.animate-write {
          animation: write-text 1.5s ease-out 2.5s both;
        }
        
        .writing-line-3.animate-write {
          animation: write-text 1.5s ease-out 4s both;
        }
        
        .writing-line-4.animate-write {
          animation: write-text 1.5s ease-out 5.5s both;
        }
        
        .writing-line-5.animate-write {
          animation: write-text 1.5s ease-out 7s both;
        }
        
        @keyframes robot-writing {
          0%, 12.5% {
            transform: rotate(0deg);
          }
          15%, 27.5% {
            transform: rotate(-15deg) translateX(10px);
          }
          30%, 42.5% {
            transform: rotate(-10deg) translateX(15px);
          }
          45%, 57.5% {
            transform: rotate(-20deg) translateX(20px);
          }
          60%, 72.5% {
            transform: rotate(-15deg) translateX(25px);
          }
          75%, 87.5% {
            transform: rotate(-25deg) translateX(30px);
          }
          90%, 100% {
            transform: rotate(0deg) translateX(0px);
          }
        }
        
        @keyframes write-text {
          0% {
            opacity: 0;
            transform: translateX(-10px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}