import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onChange, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          onChange={(e) => onChange?.(e.target.checked)}
          {...props}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-white peer-checked:text-white">
          <Check className="h-3 w-3 opacity-0 peer-checked:opacity-100" />
        </div>
        <style jsx>{`
          input[type="checkbox"]:checked {
            background-color: #3b82f6;
            border-color: #3b82f6;
          }
        `}</style>
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };