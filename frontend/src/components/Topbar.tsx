import React from 'react';
import { useNavigate } from 'react-router-dom';
import * as Avatar from '@radix-ui/react-avatar';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { UserIcon, PlusIcon } from './icons';
import SearchBar from './SearchBar';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { setCurrentProfile } from '../store/slices/profilesSlice';
import { createNewSession } from '../store/slices/sessionSlice';
import { Profile } from '../types';

interface TopbarProps {
  className?: string;
}

const Topbar: React.FC<TopbarProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const { profiles, currentProfile } = useSelector((state: RootState) => state.profiles);
  
  const handleNewChat = () => {
    if (currentProfile) {
      dispatch(createNewSession(currentProfile.id))
        .then(() => navigate('/'));
    }
  };
  
  const handleProfileChange = (profile: Profile) => {
    dispatch(setCurrentProfile(profile));
  };

  return (
    <div className={`topbar h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 ${className}`}>
      <div className="flex items-center flex-1 gap-4 max-w-3xl">
        <SearchBar />
        
        <button
          onClick={handleNewChat}
          className="new-chat-button flex items-center gap-1 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
        >
          <PlusIcon size={16} />
          <span>New Chat</span>
        </button>
      </div>
      
      <div className="ml-4">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="profile-button rounded-full border-2 border-gray-200 dark:border-gray-700 overflow-hidden hover:border-primary dark:hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Profile options"
            >
              <Avatar.Root className="w-10 h-10">
                {currentProfile?.avatar ? (
                  <Avatar.Image 
                    src={currentProfile.avatar} 
                    alt={currentProfile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Avatar.Fallback 
                    className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  >
                    <UserIcon size={20} />
                  </Avatar.Fallback>
                )}
              </Avatar.Root>
            </button>
          </DropdownMenu.Trigger>
          
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[220px] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 z-50"
              sideOffset={5}
              align="end"
            >
              <DropdownMenu.Label className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                Profiles
              </DropdownMenu.Label>
              
              {profiles.map((profile) => (
                <DropdownMenu.Item
                  key={profile.id}
                  className={`flex items-center gap-2 px-2 py-2 rounded cursor-pointer ${
                    currentProfile?.id === profile.id 
                      ? 'bg-primary/10 text-primary' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => handleProfileChange(profile)}
                >
                  <Avatar.Root className="w-8 h-8">
                    {profile.avatar ? (
                      <Avatar.Image 
                        src={profile.avatar} 
                        alt={profile.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <Avatar.Fallback 
                        className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                      >
                        {profile.name.charAt(0).toUpperCase()}
                      </Avatar.Fallback>
                    )}
                  </Avatar.Root>
                  <span>{profile.name}</span>
                  {profile.is_default && (
                    <span className="ml-auto text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">Default</span>
                  )}
                </DropdownMenu.Item>
              ))}
              
              <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
              
              <DropdownMenu.Item
                className="flex items-center gap-2 px-2 py-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => navigate('/settings?tab=profiles')}
              >
                <PlusIcon size={16} />
                <span>Create New Profile</span>
              </DropdownMenu.Item>
              
              <DropdownMenu.Item
                className="flex items-center gap-2 px-2 py-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => navigate('/settings')}
              >
                <span>Settings</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  );
};

export default Topbar;
