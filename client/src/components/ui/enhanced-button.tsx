import { forwardRef, ButtonHTMLAttributes } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  success?: boolean;
  error?: boolean;
  validationState?: 'valid' | 'invalid' | 'pending' | 'idle';
  requiresValidation?: boolean;
  validationFn?: () => boolean | Promise<boolean>;
  navigationType?: 'next' | 'previous' | 'submit' | 'cancel';
  showIcon?: boolean;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  children: React.ReactNode;
}

const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({
    className,
    variant = 'default',
    size = 'default',
    loading = false,
    success = false,
    error = false,
    validationState = 'idle',
    requiresValidation = false,
    validationFn,
    navigationType,
    showIcon = true,
    loadingText,
    successText,
    errorText,
    disabled,
    children,
    onClick,
    ...props
  }, ref) => {
    
    // Determine button state
    const isLoading = loading || validationState === 'pending';
    const isSuccess = success || validationState === 'valid';
    const isError = error || validationState === 'invalid';
    const isDisabled = disabled || isLoading || (requiresValidation && validationState === 'invalid');

    // Handle click with validation
    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled || !onClick) return;

      // Run validation if required
      if (requiresValidation && validationFn) {
        try {
          const isValid = await validationFn();
          if (!isValid) {
            e.preventDefault();
            return;
          }
        } catch (error) {
          e.preventDefault();
          return;
        }
      }

      onClick(e);
    };

    // Get appropriate icon
    const getIcon = () => {
      if (!showIcon) return null;

      if (isLoading) {
        return <Loader2 className="h-4 w-4 animate-spin" />;
      }

      if (isSuccess) {
        return <CheckCircle className="h-4 w-4" />;
      }

      if (isError) {
        return <AlertTriangle className="h-4 w-4" />;
      }

      // Navigation icons
      if (navigationType === 'next') {
        return <ArrowRight className="h-4 w-4" />;
      }

      if (navigationType === 'previous') {
        return <ArrowLeft className="h-4 w-4" />;
      }

      return null;
    };

    // Get appropriate text
    const getText = () => {
      if (isLoading && loadingText) return loadingText;
      if (isSuccess && successText) return successText;
      if (isError && errorText) return errorText;
      return children;
    };

    // Get appropriate variant
    const getVariant = () => {
      if (isError) return 'destructive';
      if (isSuccess) return 'default';
      return variant;
    };

    const icon = getIcon();
    const text = getText();
    const buttonVariant = getVariant();

    return (
      <Button
        ref={ref}
        className={cn(
          // Base styles
          "transition-all duration-200",
          
          // Loading state
          isLoading && "cursor-not-allowed opacity-70",
          
          // Success state
          isSuccess && "bg-green-600 hover:bg-green-700 text-white",
          
          // Error state
          isError && "bg-red-600 hover:bg-red-700 text-white",
          
          // Navigation specific styles
          navigationType === 'next' && "bg-blue-600 hover:bg-blue-700 text-white",
          navigationType === 'previous' && "border-gray-300 text-gray-700 hover:bg-gray-50",
          navigationType === 'submit' && "bg-green-600 hover:bg-green-700 text-white",
          navigationType === 'cancel' && "bg-gray-600 hover:bg-gray-700 text-white",
          
          className
        )}
        variant={buttonVariant}
        size={size}
        disabled={isDisabled}
        onClick={handleClick}
        {...props}
      >
        <div className="flex items-center gap-2">
          {navigationType === 'previous' && icon}
          {navigationType !== 'previous' && navigationType !== 'next' && icon}
          <span>{text}</span>
          {navigationType === 'next' && icon}
        </div>
      </Button>
    );
  }
);

EnhancedButton.displayName = 'EnhancedButton';

export { EnhancedButton };
export type { EnhancedButtonProps };