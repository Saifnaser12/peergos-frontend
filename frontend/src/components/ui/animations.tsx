import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  className?: string;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 500,
  direction = 'up',
  distance = 20,
  className
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const getTransform = () => {
    if (!isVisible) {
      switch (direction) {
        case 'up':
          return `translateY(${distance}px)`;
        case 'down':
          return `translateY(-${distance}px)`;
        case 'left':
          return `translateX(${distance}px)`;
        case 'right':
          return `translateX(-${distance}px)`;
        default:
          return `translateY(${distance}px)`;
      }
    }
    return 'translateY(0)';
  };

  return (
    <div
      className={cn("transition-all ease-out", className)}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transitionDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  );
}

interface SlideInProps {
  children: React.ReactNode;
  direction?: 'left' | 'right';
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
}

export function SlideIn({
  children,
  direction = 'left',
  delay = 0,
  duration = 400,
  distance = 100,
  className
}: SlideInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const getTransform = () => {
    if (!isVisible) {
      return direction === 'left' ? `translateX(-${distance}px)` : `translateX(${distance}px)`;
    }
    return 'translateX(0)';
  };

  return (
    <div
      className={cn("transition-transform ease-out", className)}
      style={{
        transform: getTransform(),
        transitionDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  );
}

interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  scale?: number;
  className?: string;
}

export function ScaleIn({
  children,
  delay = 0,
  duration = 300,
  scale = 0.8,
  className
}: ScaleInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn("transition-all ease-out", className)}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: `scale(${isVisible ? 1 : scale})`,
        transitionDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  );
}

interface StaggeredChildrenProps {
  children: React.ReactNode[];
  delay?: number;
  stagger?: number;
  className?: string;
}

export function StaggeredChildren({
  children,
  delay = 0,
  stagger = 100,
  className
}: StaggeredChildrenProps) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <FadeIn key={index} delay={delay + (index * stagger)}>
          {child}
        </FadeIn>
      ))}
    </div>
  );
}

interface PulseProps {
  children: React.ReactNode;
  intensity?: 'subtle' | 'normal' | 'strong';
  speed?: 'slow' | 'normal' | 'fast';
  className?: string;
}

export function Pulse({
  children,
  intensity = 'normal',
  speed = 'normal',
  className
}: PulseProps) {
  const getIntensityClass = () => {
    switch (intensity) {
      case 'subtle':
        return 'animate-pulse-subtle';
      case 'normal':
        return 'animate-pulse';
      case 'strong':
        return 'animate-pulse-strong';
      default:
        return 'animate-pulse';
    }
  };

  const getSpeedClass = () => {
    switch (speed) {
      case 'slow':
        return 'animation-duration-3000';
      case 'normal':
        return 'animation-duration-2000';
      case 'fast':
        return 'animation-duration-1000';
      default:
        return 'animation-duration-2000';
    }
  };

  return (
    <div className={cn(getIntensityClass(), getSpeedClass(), className)}>
      {children}
    </div>
  );
}

interface BounceInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function BounceIn({
  children,
  delay = 0,
  className
}: BounceInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        "transition-all duration-600 ease-out",
        isVisible ? "animate-bounce-in" : "opacity-0 scale-50",
        className
      )}
    >
      {children}
    </div>
  );
}

interface FloatingProps {
  children: React.ReactNode;
  intensity?: 'subtle' | 'normal' | 'strong';
  speed?: 'slow' | 'normal' | 'fast';
  className?: string;
}

export function Floating({
  children,
  intensity = 'normal',
  speed = 'normal',
  className
}: FloatingProps) {
  const getIntensityClass = () => {
    switch (intensity) {
      case 'subtle':
        return 'animate-float-subtle';
      case 'normal':
        return 'animate-float';
      case 'strong':
        return 'animate-float-strong';
      default:
        return 'animate-float';
    }
  };

  const getSpeedClass = () => {
    switch (speed) {
      case 'slow':
        return 'animation-duration-4000';
      case 'normal':
        return 'animation-duration-3000';
      case 'fast':
        return 'animation-duration-2000';
      default:
        return 'animation-duration-3000';
    }
  };

  return (
    <div className={cn(getIntensityClass(), getSpeedClass(), className)}>
      {children}
    </div>
  );
}

interface HoverLiftProps {
  children: React.ReactNode;
  intensity?: 'subtle' | 'normal' | 'strong';
  className?: string;
}

export function HoverLift({
  children,
  intensity = 'normal',
  className
}: HoverLiftProps) {
  const getIntensityClass = () => {
    switch (intensity) {
      case 'subtle':
        return 'hover:transform hover:-translate-y-1 hover:shadow-lg';
      case 'normal':
        return 'hover:transform hover:-translate-y-2 hover:shadow-xl';
      case 'strong':
        return 'hover:transform hover:-translate-y-3 hover:shadow-2xl';
      default:
        return 'hover:transform hover:-translate-y-2 hover:shadow-xl';
    }
  };

  return (
    <div
      className={cn(
        "transition-all duration-200 ease-out cursor-pointer",
        getIntensityClass(),
        className
      )}
    >
      {children}
    </div>
  );
}

interface RippleEffectProps {
  children: React.ReactNode;
  color?: string;
  duration?: number;
  className?: string;
}

export function RippleEffect({
  children,
  color = 'rgba(255, 255, 255, 0.6)',
  duration = 600,
  className
}: RippleEffectProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const addRipple = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const newRipple = {
      id: Date.now(),
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, duration);
  };

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onMouseDown={addRipple}
    >
      {children}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute pointer-events-none animate-ripple"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            backgroundColor: color,
            animationDuration: `${duration}ms`
          }}
        />
      ))}
    </div>
  );
}