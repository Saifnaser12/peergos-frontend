import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface HelpTooltipProps {
  content: string;
  className?: string;
}

export function HelpTooltip({ content, className = '' }: HelpTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle 
          size={16} 
          className={`text-gray-400 hover:text-gray-600 cursor-help ${className}`}
        />
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs text-sm">{content}</p>
      </TooltipContent>
    </Tooltip>
  );
}