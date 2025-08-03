import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigation } from '@/context/navigation-context';
import Sidebar from './sidebar';
import TopBar from './topbar';
import ProgressTracker from '@/components/ui/progress-tracker';
import ChatBubble from '@/components/chat/chat-bubble';
import { MobileTabBar } from '../MobileTabBar';
import { FloatingAIButton } from '../FloatingAIButton';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();

  // Simple auth check - in production would redirect to login
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Peergos</h1>
          <p className="text-gray-600">UAE Tax Compliance Platform</p>
          <p className="text-sm text-gray-500 mt-2">Demo Mode - Auto logged in as admin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50">
          <div className="flex h-full">
            <div className="flex-1 p-6">
              {children}
            </div>
            {/* Right sidebar with progress tracker - only show on main pages */}
            <div className="w-80 border-l border-gray-200 bg-white hidden xl:block">
              <ProgressTracker 
                variant="sidebar" 
                showDetails={true} 
                showNavigation={true}
                className="h-full"
              />
            </div>
          </div>
        </main>
      </div>
      
      {/* AI Chat Assistant */}
      <ChatBubble />
      
      {/* Mobile Components */}
      <MobileTabBar />
      <FloatingAIButton />
    </div>
  );
}
