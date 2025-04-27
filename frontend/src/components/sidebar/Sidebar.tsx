import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Library, Image as ImageIcon, Settings } from 'lucide-react';
import SidebarItem from './SidebarItem';
import { useAppSelector } from '@/redux/store';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const collapsed = useAppSelector((state) => state.ui.sidebarCollapsed);
  
  const sidebarItems = [
    { icon: <MessageSquare size={24} />, label: 'Chat', to: '/' },
    { icon: <Library size={24} />, label: 'Library', to: '/library' },
    { icon: <ImageIcon size={24} />, label: 'Albums', to: '/albums' },
    { icon: <Settings size={24} />, label: 'Settings', to: '/settings' },
  ];

  const variants = {
    expanded: { width: '80px' },
    collapsed: { width: '0px' },
  };

  return (
    <motion.div
      className="bg-background border-r border-border h-full flex flex-col py-4 overflow-hidden"
      initial="expanded"
      animate={collapsed ? 'collapsed' : 'expanded'}
      variants={variants}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center space-y-6 mt-6">
        {sidebarItems.map((item) => (
          <SidebarItem
            key={item.to}
            icon={item.icon}
            label={item.label}
            to={item.to}
            isActive={location.pathname === item.to}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default Sidebar;
