
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  isActive: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ 
  icon, 
  label, 
  to, 
  isActive,
  onClick 
}) => {
  return (
    <Link to={to} onClick={onClick}>
      <motion.div
        className={cn(
          "flex flex-col items-center p-3 rounded-md transition-colors cursor-pointer",
          isActive ? "bg-secondary text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="w-6 h-6">{icon}</div>
        <span className="text-xs mt-1">{label}</span>
      </motion.div>
    </Link>
  );
};

export default SidebarItem;
