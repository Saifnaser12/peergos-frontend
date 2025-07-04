import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import Sidebar from './sidebar';
import TopBar from './topbar';

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
        
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
