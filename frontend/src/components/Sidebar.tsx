import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as Tooltip from '@radix-ui/react-tooltip';
import { 
  SearchIcon, 
  LibraryIcon, 
  AlbumsIcon, 
  SettingsIcon 
} from './icons';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const sidebarItems = [
    { path: '/', icon: <SearchIcon />, tooltip: 'Search' },
    { path: '/library', icon: <LibraryIcon />, tooltip: 'Library' },
    { path: '/albums', icon: <AlbumsIcon />, tooltip: 'Albums' },
    { path: '/settings', icon: <SettingsIcon />, tooltip: 'Settings' }
  ];

  return (
    <div className={`sidebar h-full w-16 bg-gray-800 flex flex-col items-center py-6 ${className}`}>
      <Tooltip.Provider>
        {sidebarItems.map((item) => (
          <Tooltip.Root key={item.path} delayDuration={300}>
            <Tooltip.Trigger asChild>
              <Link
                to={item.path}
                className={`sidebar-item w-10 h-10 flex items-center justify-center rounded-md mb-4 hover:bg-gray-700 transition-colors ${
                  isActive(item.path) ? 'bg-primary text-white' : 'text-gray-400'
                }`}
                aria-current={isActive(item.path) ? 'page' : undefined}
              >
                {item.icon}
              </Link>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="bg-gray-900 text-white px-3 py-1 rounded text-sm"
                sideOffset={5}
              >
                {item.tooltip}
                <Tooltip.Arrow className="fill-gray-900" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        ))}
      </Tooltip.Provider>
    </div>
  );
};

export default Sidebar;
