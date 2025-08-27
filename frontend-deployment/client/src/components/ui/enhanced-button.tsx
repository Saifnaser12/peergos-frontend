import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface EnhancedButtonProps extends ButtonProps {
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  gradient?: boolean;
  ripple?: boolean;
}

export function EnhancedButton({
  children,
  loading = false,
  icon,
  iconPosition = 'left',
  gradient = false,
  ripple = true,
  className,
  disabled,
  variant = 'default',
  size = 'default',
  ...props
}: EnhancedButtonProps) {
  const isDisabled = disabled || loading;

  const buttonClasses = cn(
    // Base button styles
    "relative overflow-hidden transition-all duration-200 ease-in-out transform-gpu",
    
    // Hover and focus states
    "hover:scale-[1.02] active:scale-[0.98]",
    "focus:ring-2 focus:ring-offset-2",
    
    // Gradient variants
    gradient && variant === 'default' && [
      "bg-gradient-to-r from-blue-600 to-blue-700",
      "hover:from-blue-700 hover:to-blue-800",
      "text-white border-0"
    ],
    
    gradient && variant === 'destructive' && [
      "bg-gradient-to-r from-red-600 to-red-700",
      "hover:from-red-700 hover:to-red-800",
      "text-white border-0"
    ],
    
    gradient && variant === 'outline' && [
      "bg-gradient-to-r from-gray-50 to-gray-100",
      "hover:from-gray-100 hover:to-gray-200",
      "border-gradient-to-r border-gray-300"
    ],
    
    // Disabled state
    isDisabled && "opacity-60 cursor-not-allowed hover:scale-100 active:scale-100",
    
    // Shadow effects
    !isDisabled && variant === 'default' && "shadow-lg hover:shadow-xl",
    !isDisabled && variant === 'destructive' && "shadow-lg hover:shadow-xl",
    
    className
  );

  return (
    <Button
      className={buttonClasses}
      disabled={isDisabled}
      variant={gradient ? undefined : variant}
      size={size}
      {...props}
    >
      {ripple && (
        <span className="absolute inset-0 bg-white opacity-0 rounded-md transition-opacity duration-150 hover:opacity-10" />
      )}
      
      <span className="relative flex items-center justify-center gap-2">
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        
        {!loading && icon && iconPosition === 'left' && (
          <span className="flex-shrink-0">{icon}</span>
        )}
        
        <span className="flex-1">{children}</span>
        
        {!loading && icon && iconPosition === 'right' && (
          <span className="flex-shrink-0">{icon}</span>
        )}
      </span>
    </Button>
  );
}

// Preset button variants for common use cases
export function PrimaryButton(props: EnhancedButtonProps) {
  return <EnhancedButton variant="default" gradient {...props} />;
}

export function SecondaryButton(props: EnhancedButtonProps) {
  return <EnhancedButton variant="outline" {...props} />;
}

export function DangerButton(props: EnhancedButtonProps) {
  return <EnhancedButton variant="destructive" gradient {...props} />;
}

export function GhostButton(props: EnhancedButtonProps) {
  return <EnhancedButton variant="ghost" {...props} />;
}