import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
}

export function QuickActionButton({ 
  icon: Icon, 
  label, 
  onClick, 
  variant = 'outline',
  className 
}: QuickActionButtonProps) {
  return (
    <Button
      variant={variant}
      onClick={onClick}
      className={cn("flex items-center gap-2", className)}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  );
}