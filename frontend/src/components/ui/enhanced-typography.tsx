import React from 'react';
import { cn } from '@/lib/utils';

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'overline';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'muted';
  align?: 'left' | 'center' | 'right' | 'justify';
  transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  spacing?: 'tight' | 'normal' | 'wide';
  gradient?: boolean;
}

export function Typography({
  children,
  className,
  variant = 'body1',
  weight = 'normal',
  color = 'primary',
  align = 'left',
  transform = 'none',
  spacing = 'normal',
  gradient = false,
  ...props
}: TypographyProps) {
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'h1':
        return 'text-4xl md:text-5xl lg:text-6xl leading-tight';
      case 'h2':
        return 'text-3xl md:text-4xl lg:text-5xl leading-tight';
      case 'h3':
        return 'text-2xl md:text-3xl lg:text-4xl leading-snug';
      case 'h4':
        return 'text-xl md:text-2xl lg:text-3xl leading-snug';
      case 'h5':
        return 'text-lg md:text-xl lg:text-2xl leading-normal';
      case 'h6':
        return 'text-base md:text-lg lg:text-xl leading-normal';
      case 'body1':
        return 'text-base leading-relaxed';
      case 'body2':
        return 'text-sm leading-relaxed';
      case 'caption':
        return 'text-xs leading-normal';
      case 'overline':
        return 'text-xs uppercase tracking-wider leading-normal';
      default:
        return 'text-base leading-relaxed';
    }
  };

  const getWeightClasses = () => {
    switch (weight) {
      case 'light':
        return 'font-light';
      case 'normal':
        return 'font-normal';
      case 'medium':
        return 'font-medium';
      case 'semibold':
        return 'font-semibold';
      case 'bold':
        return 'font-bold';
      default:
        return 'font-normal';
    }
  };

  const getColorClasses = () => {
    if (gradient) {
      return 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent';
    }
    
    switch (color) {
      case 'primary':
        return 'text-gray-900 dark:text-white';
      case 'secondary':
        return 'text-gray-600 dark:text-gray-300';
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-amber-600 dark:text-amber-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'muted':
        return 'text-gray-500 dark:text-gray-400';
      default:
        return 'text-gray-900 dark:text-white';
    }
  };

  const getAlignClasses = () => {
    switch (align) {
      case 'left':
        return 'text-left';
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      case 'justify':
        return 'text-justify';
      default:
        return 'text-left';
    }
  };

  const getTransformClasses = () => {
    switch (transform) {
      case 'uppercase':
        return 'uppercase';
      case 'lowercase':
        return 'lowercase';
      case 'capitalize':
        return 'capitalize';
      default:
        return '';
    }
  };

  const getSpacingClasses = () => {
    switch (spacing) {
      case 'tight':
        return 'tracking-tight';
      case 'normal':
        return 'tracking-normal';
      case 'wide':
        return 'tracking-wide';
      default:
        return 'tracking-normal';
    }
  };

  const Component = variant.startsWith('h') ? variant as keyof JSX.IntrinsicElements : 'p';

  return (
    <Component
      className={cn(
        'font-inter',
        getVariantClasses(),
        getWeightClasses(),
        getColorClasses(),
        getAlignClasses(),
        getTransformClasses(),
        getSpacingClasses(),
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

// Preset components for common use cases
export function PageTitle({ children, className, ...props }: Omit<TypographyProps, 'variant'>) {
  return (
    <Typography 
      variant="h1" 
      weight="bold" 
      className={cn("mb-6", className)} 
      {...props}
    >
      {children}
    </Typography>
  );
}

export function SectionTitle({ children, className, ...props }: Omit<TypographyProps, 'variant'>) {
  return (
    <Typography 
      variant="h2" 
      weight="semibold" 
      className={cn("mb-4", className)} 
      {...props}
    >
      {children}
    </Typography>
  );
}

export function SubsectionTitle({ children, className, ...props }: Omit<TypographyProps, 'variant'>) {
  return (
    <Typography 
      variant="h3" 
      weight="medium" 
      className={cn("mb-3", className)} 
      {...props}
    >
      {children}
    </Typography>
  );
}

export function CardTitle({ children, className, ...props }: Omit<TypographyProps, 'variant'>) {
  return (
    <Typography 
      variant="h4" 
      weight="semibold" 
      className={cn("mb-2", className)} 
      {...props}
    >
      {children}
    </Typography>
  );
}

export function BodyText({ children, className, ...props }: Omit<TypographyProps, 'variant'>) {
  return (
    <Typography 
      variant="body1" 
      className={cn("mb-4", className)} 
      {...props}
    >
      {children}
    </Typography>
  );
}

export function CaptionText({ children, className, ...props }: Omit<TypographyProps, 'variant'>) {
  return (
    <Typography 
      variant="caption" 
      color="secondary" 
      className={className} 
      {...props}
    >
      {children}
    </Typography>
  );
}

export function OverlineText({ children, className, ...props }: Omit<TypographyProps, 'variant'>) {
  return (
    <Typography 
      variant="overline" 
      color="muted" 
      weight="medium" 
      className={className} 
      {...props}
    >
      {children}
    </Typography>
  );
}

export function GradientText({ children, className, ...props }: Omit<TypographyProps, 'gradient'>) {
  return (
    <Typography 
      gradient 
      weight="bold" 
      className={className} 
      {...props}
    >
      {children}
    </Typography>
  );
}