import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatModal from './chat-modal';
import { cn } from '@/lib/utils';

export default function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
    setHasNewMessage(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Chat Bubble */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={handleOpen}
          className={cn(
            "h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300",
            "bg-blue-600 hover:bg-blue-700 text-white",
            "flex items-center justify-center relative",
            isOpen && "scale-95"
          )}
          aria-label="Open AI Assistant"
        >
          <MessageCircle size={24} />
          
          {/* New message indicator */}
          {hasNewMessage && !isOpen && (
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
              <div className="h-2 w-2 bg-white rounded-full" />
            </div>
          )}
          
          {/* Pulse animation for attention */}
          {!isOpen && (
            <div className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20" />
          )}
        </Button>
        
        {/* Tooltip */}
        <div className={cn(
          "absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg",
          "opacity-0 pointer-events-none transition-opacity duration-200",
          "whitespace-nowrap shadow-lg",
          !isOpen && "group-hover:opacity-100"
        )}>
          Ask Peergos AI
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      </div>

      {/* Chat Modal */}
      <ChatModal 
        isOpen={isOpen} 
        onClose={handleClose}
        onNewMessage={() => setHasNewMessage(true)}
      />
    </>
  );
}