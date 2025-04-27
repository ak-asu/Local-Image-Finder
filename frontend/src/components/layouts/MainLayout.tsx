
import React from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAppSelector } from '@/redux/store';
import Sidebar from '@/components/sidebar/Sidebar';
import TopBar from '@/components/topbar/TopBar';

interface MainLayoutProps {
  onSearch: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ onSearch }) => {
  const isLoading = useAppSelector((state) => state.ui.isLoading);

  return (
    <div className="app-container">
      <Sidebar />
      
      <div className="app-content">
        <TopBar onSearch={onSearch} />
        
        <main className="flex-1 overflow-auto relative">
          <AnimatePresence mode="wait">
            {isLoading && (
              <div className="absolute top-4 right-4 z-50">
                <div className="w-8 h-8 border-4 border-primary/50 border-t-primary rounded-full animate-spin"></div>
              </div>
            )}
          </AnimatePresence>
          
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
