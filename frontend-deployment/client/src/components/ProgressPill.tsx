import { cn } from '@/lib/utils';

interface ProgressPillProps {
  step: number;
  total: number;
  className?: string;
}

export function ProgressPill({ step, total, className }: ProgressPillProps) {
  return (
    <div className={cn(
      "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      className
    )}>
      Step {step} of {total}
    </div>
  );
}