
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, User } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/redux/store';
import { setActiveProfile } from '@/redux/slices/userSlice';

const ProfileDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useAppDispatch();
  const profiles = useAppSelector((state) => state.user.profiles);
  const activeProfileId = useAppSelector((state) => state.user.activeProfileId);
  
  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0];

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleProfileSelect = (profileId: string) => {
    dispatch(setActiveProfile(profileId));
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <motion.div
        className="flex items-center space-x-2 p-2 rounded-full bg-secondary cursor-pointer"
        onClick={handleToggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
          {activeProfile?.avatar ? (
            <img
              src={activeProfile.avatar}
              alt={activeProfile.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User size={16} />
          )}
        </div>
        <span className="text-sm">{activeProfile?.name}</span>
        <ChevronDown size={16} className={isOpen ? 'transform rotate-180' : ''} />
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute right-0 mt-2 w-48 bg-popover rounded-md shadow-lg z-10 border border-border"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="py-1">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-secondary flex items-center space-x-2"
                  onClick={() => handleProfileSelect(profile.id)}
                >
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                    {profile.avatar ? (
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User size={12} />
                    )}
                  </div>
                  <span>{profile.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileDropdown;
