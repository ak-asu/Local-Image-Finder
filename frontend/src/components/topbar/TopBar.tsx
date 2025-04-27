
import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, Plus } from 'lucide-react';
import { useAppDispatch } from '@/redux/store';
import { toggleSidebar } from '@/redux/slices/uiSlice';
import SearchInput from './SearchInput';
import ProfileDropdown from './ProfileDropdown';
import AppLogo from '../common/AppLogo';

interface TopBarProps {
  onSearch: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onSearch }) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  
  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };
  
  const isChat = location.pathname === '/';

  const renderCenterContent = () => {
    if (isChat) {
      return <SearchInput onSubmit={onSearch} />;
    }
    
    // Return appropriate title based on route
    const getTitleForRoute = () => {
      switch (location.pathname) {
        case '/library':
          return 'Library';
        case '/albums':
          return 'Albums';
        case '/settings':
          return 'Settings';
        default:
          return 'ImageFinder';
      }
    };
    
    return (
      <div className="text-xl font-bold">
        {getTitleForRoute()}
      </div>
    );
  };

  const renderLeftContent = () => {
    return (
      <div className="flex items-center space-x-4">
        <motion.button
          className="p-2 rounded-md hover:bg-secondary"
          onClick={handleToggleSidebar}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Menu size={20} />
        </motion.button>
        
        {isChat && (
          <motion.button
            className="flex items-center space-x-2 p-2 rounded-md bg-secondary hover:bg-secondary/80"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={16} />
            <span className="text-sm font-medium">New Chat</span>
          </motion.button>
        )}
      </div>
    );
  };

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-4">
      {renderLeftContent()}
      <div className="flex-grow flex justify-center">
        {renderCenterContent()}
      </div>
      <div className="flex items-center space-x-4">
        <ProfileDropdown />
      </div>
    </header>
  );
};

export default TopBar;
