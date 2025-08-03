import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { HelpCircle, Info, AlertCircle, CheckCircle } from 'lucide-react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
  className?: string;
  maxWidth?: string;
  variant?: 'default' | 'info' | 'warning' | 'success' | 'error';
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 500,
  disabled = false,
  className,
  maxWidth = 'max-w-xs',
  variant = 'default'
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    if (disabled) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  // Calculate optimal position based on viewport
  useEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) return;

    const trigger = triggerRef.current.getBoundingClientRect();
    const tooltip = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let newPosition = position;

    // Check if tooltip would go outside viewport and adjust
    switch (position) {
      case 'top':
        if (trigger.top - tooltip.height < 10) {
          newPosition = 'bottom';
        }
        break;
      case 'bottom':
        if (trigger.bottom + tooltip.height > viewport.height - 10) {
          newPosition = 'top';
        }
        break;
      case 'left':
        if (trigger.left - tooltip.width < 10) {
          newPosition = 'right';
        }
        break;
      case 'right':
        if (trigger.right + tooltip.width > viewport.width - 10) {
          newPosition = 'left';
        }
        break;
    }

    setActualPosition(newPosition);
  }, [isVisible, position]);

  const getPositionClasses = () => {
    const base = 'absolute z-50';
    
    switch (actualPosition) {
      case 'top':
        return `${base} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
      case 'bottom':
        return `${base} top-full left-1/2 transform -translate-x-1/2 mt-2`;
      case 'left':
        return `${base} right-full top-1/2 transform -translate-y-1/2 mr-2`;
      case 'right':
        return `${base} left-full top-1/2 transform -translate-y-1/2 ml-2`;
      default:
        return `${base} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
    }
  };

  const getArrowClasses = () => {
    const base = 'absolute w-2 h-2 bg-gray-900 transform rotate-45';
    
    switch (actualPosition) {
      case 'top':
        return `${base} top-full left-1/2 -translate-x-1/2 -translate-y-1/2`;
      case 'bottom':
        return `${base} bottom-full left-1/2 -translate-x-1/2 translate-y-1/2`;
      case 'left':
        return `${base} left-full top-1/2 -translate-x-1/2 -translate-y-1/2`;
      case 'right':
        return `${base} right-full top-1/2 translate-x-1/2 -translate-y-1/2`;
      default:
        return `${base} top-full left-1/2 -translate-x-1/2 -translate-y-1/2`;
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'info':
        return 'bg-blue-900 text-blue-100 border-blue-700';
      case 'warning':
        return 'bg-yellow-900 text-yellow-100 border-yellow-700';
      case 'success':
        return 'bg-green-900 text-green-100 border-green-700';
      case 'error':
        return 'bg-red-900 text-red-100 border-red-700';
      default:
        return 'bg-gray-900 text-white border-gray-700';
    }
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            getPositionClasses(),
            'px-3 py-2 text-sm font-medium rounded-lg shadow-lg border',
            'animate-fade-in-up',
            maxWidth,
            getVariantClasses(),
            className
          )}
          role="tooltip"
        >
          {content}
          <div className={getArrowClasses()} />
        </div>
      )}
    </div>
  );
}

export default Tooltip;

// Additional tooltip exports for compatibility
export const TooltipProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const TooltipContent = Tooltip;
export const TooltipTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;

// Contextual help component with predefined styling
interface ContextualHelpProps {
  content: React.ReactNode;
  variant?: 'info' | 'warning' | 'help';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ContextualHelp({ 
  content, 
  variant = 'help', 
  size = 'sm',
  className 
}: ContextualHelpProps) {
  const getIcon = () => {
    switch (variant) {
      case 'info':
        return <Info className={cn('text-blue-600', getSizeClasses())} />;
      case 'warning':
        return <AlertCircle className={cn('text-yellow-600', getSizeClasses())} />;
      case 'help':
      default:
        return <HelpCircle className={cn('text-gray-600', getSizeClasses())} />;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'h-3 w-3';
      case 'md': return 'h-4 w-4';
      case 'lg': return 'h-5 w-5';
      default: return 'h-4 w-4';
    }
  };

  const getVariantForTooltip = () => {
    switch (variant) {
      case 'info': return 'info';
      case 'warning': return 'warning';
      case 'help':
      default: return 'default';
    }
  };

  return (
    <Tooltip 
      content={content} 
      variant={getVariantForTooltip()}
      className={className}
    >
      <button 
        type="button"
        className="inline-flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200 p-1"
        aria-label="Help"
      >
        {getIcon()}
      </button>
    </Tooltip>
  );
}

// Field help component for forms
interface FieldHelpProps {
  content: React.ReactNode;
  label?: string;
  required?: boolean;
  className?: string;
}

export function FieldHelp({ content, label, required, className }: FieldHelpProps) {
  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <ContextualHelp content={content} size="sm" />
    </div>
  );
}