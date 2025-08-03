import * as React from "react";
import { cn } from "@/lib/utils";

export interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ className, content, children, position = 'top', ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);

    return (
      <div className="relative inline-block">
        <div
          ref={ref}
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
          {...props}
        >
          {children}
        </div>
        {isVisible && (
          <div
            className={cn(
              "absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-md shadow-lg -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full",
              className
            )}
          >
            {content}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        )}
      </div>
    );
  }
);
Tooltip.displayName = "Tooltip";

const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const TooltipContent = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("px-3 py-2 text-sm", className)} {...props}>
      {children}
    </div>
  );
};

const TooltipTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn("cursor-pointer", className)}
    {...props}
  />
));
TooltipTrigger.displayName = "TooltipTrigger";

export { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger };