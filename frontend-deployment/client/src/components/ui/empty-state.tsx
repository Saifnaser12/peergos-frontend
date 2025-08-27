import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className
}: EmptyStateProps) {
  return (
    <Card className={cn("border-2 border-dashed border-gray-200", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 mb-4">
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6 max-w-sm">{description}</p>
        {actionLabel && onAction && (
          <Button onClick={onAction} className="min-w-32">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface DataDisplayProps {
  value: number;
  currency?: boolean;
  fallbackText?: string;
  children: React.ReactNode;
}

export function DataDisplay({ 
  value, 
  currency = false, 
  fallbackText = "No data available",
  children 
}: DataDisplayProps) {
  if (value === 0) {
    return (
      <div className="text-gray-400 italic">
        {fallbackText}
      </div>
    );
  }
  
  return <>{children}</>;
}