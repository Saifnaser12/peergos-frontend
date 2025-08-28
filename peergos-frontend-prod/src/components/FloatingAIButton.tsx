import React, { useState } from 'react';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export function FloatingAIButton() {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    setLocation('/ai');
  };

  return (
    <Button
      onClick={handleClick}
      size="lg"
      className="md:hidden fixed bottom-20 right-6 z-40 h-14 w-14 rounded-full shadow-lg"
    >
      <Bot className="h-6 w-6" />
    </Button>
  );
}