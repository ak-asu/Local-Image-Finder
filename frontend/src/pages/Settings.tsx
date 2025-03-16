import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import * as Dialog from '@radix-ui/react-dialog';
import * as Avatar from '@radix-ui/react-avatar';
import { RootState, AppDispatch } from '../store';
import { 
  fetchSettings, 
  updateSettings,
  validateFolders 
} from '../store/slices/settingsSlice';
import { 
  createProfile, 
  deleteProfile,
  setDefaultProfile
} from '../store/slices/profilesSlice';
import { ThemeMode, ModelType } from '../types';
import { TrashIcon, CheckIcon, FolderIcon, PlusIcon } from '../components/icons';

const Settings: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'general';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [folderPath, setFolderPath] = useState('');
  const [isCreateProfileOpen, setIsCreateProfileOpen] = useState(false);
  const [newProfileData, setNewProfileData] = useState({
    name: '',
    avatar: '',
  });

  // Redux selectors
  const { currentProfile, profiles } = useSelector((state: RootState) => state.profiles);
  const { currentSettings } = useSelector((state: RootState) => state.settings);

  useEffect(() => {
    if (currentProfile) {
      dispatch(fetchSettings(currentProfile.id));
    }
  }, [currentProfile, dispatch]);

  useEffect(() => {
    // Update URL when tab changes
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleSettingsUpdate = (key: string, value: any) => {
    if (!currentProfile || !currentSettings) return;
    
    dispatch(updateSettings({
      profileId: currentProfile.id, 
      settings: { [key]: value }
    }));
  };

  const handleAddFolder = async () => {
    if (!folderPath || !currentProfile || !currentSettings) return;
    
    // Validate the folder path first
    const validation = await dispatch(validateFolders([folderPath])).unwrap();
    
    if (validation && validation[folderPath]) {
      const updatedFolders = [...currentSettings.monitored_folders, folderPath];
      handleSettingsUpdate('monitored_folders', updatedFolders);
      setFolderPath('');
    }
  };

  const handleRemoveFolder = (folder: string) => {
    if (!currentSettings) return;
    
    const updatedFolders = currentSettings.monitored_folders.filter(f => f !== folder);
    handleSettingsUpdate('monitored_folders', updatedFolders);
  };

  const handleCreateProfile = async () => {
    if (!newProfileData.name.trim()) return;
    
    await dispatch(createProfile({
      name: newProfileData.name,
      avatar: newProfileData.avatar || undefined
    }));
    
    setNewProfileData({ name: '', avatar: '' });
    setIsCreateProfileOpen(false);
  };

  // const handleUpdateProfile = (profileId: string, data: Partial<Profile>) => {
  //   dispatch(updateProfile({ profileId, data }));
  // };

  const handleDeleteProfileClick = (profileId: string) => {
    if (profiles.length <= 1) {
      alert('Cannot delete the only profile. At least one profile is required.');
      return;
    }
    
    if (confirm('Are you sure you want to delete this profile? This will remove all associated data.')) {
      dispatch(deleteProfile(profileId));
    }
  };

  const handleSetDefaultProfile = (profileId: string) => {
    dispatch(setDefaultProfile(profileId));
  };

  if (!currentProfile || !currentSettings) {
    return (
      <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-md">
        <p className="text-center text-lg text-gray-600 dark:text-gray-300">
          Loading settings...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Settings</h1>
      
      <Tabs.Root 
        value={activeTab} 
        onValueChange={handleTabChange} 
        className="w-full"
      >
        <Tabs.List className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <Tabs.Trigger 
            value="general" 
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'general' 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            General
          </Tabs.Trigger>
          
          <Tabs.Trigger 
            value="folders" 
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'folders' 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Folders
          </Tabs.Trigger>
          
          <Tabs.Trigger 
            value="models" 
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'models' 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            AI Models
          </Tabs.Trigger>
          
          <Tabs.Trigger 
            value="profiles" 
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'profiles' 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Profiles
          </Tabs.Trigger>
        </Tabs.List>
        
        {/* General Settings */}
        <Tabs.Content value="general" className="py-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">General Settings</h2>
            
            <div className="space-y-4">
              {/* Theme Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <select
                  value={currentSettings.theme_mode}
                  onChange={(e) => handleSettingsUpdate('theme_mode', e.target.value)}
                  className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2"
                >
                  <option value={ThemeMode.LIGHT}>Light</option>
                  <option value={ThemeMode.DARK}>Dark</option>
                  <option value={ThemeMode.SYSTEM}>System Default</option>
                </select>
              </div>
              
              {/* Similar Image Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Similar Image Results Count
                </label>
                <input
                  type="number"
                  value={currentSettings.similar_image_count}
                  onChange={(e) => handleSettingsUpdate('similar_image_count', parseInt(e.target.value))}
                  min="5"
                  max="100"
                  className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2"
                />
              </div>
              
              {/* Similarity Threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Similarity Threshold: {currentSettings.similarity_threshold.toFixed(2)}
                </label>
                <input
                  type="range"
                  value={currentSettings.similarity_threshold}
                  onChange={(e) => handleSettingsUpdate('similarity_threshold', parseFloat(e.target.value))}
                  min="0.1"
                  max="0.99"
                  step="0.01"
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>More Results (Less Similar)</span>
                  <span>Fewer Results (More Similar)</span>
                </div>
              </div>
              
              {/* Auto Index Interval */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Auto-Index Interval (minutes)
                </label>
                <input
                  type="number"
                  value={currentSettings.auto_index_interval_minutes}
                  onChange={(e) => handleSettingsUpdate('auto_index_interval_minutes', parseInt(e.target.value))}
                  min="5"
                  className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2"
                />
              </div>
              
              {/* Last Indexed Time */}
              {currentSettings.last_indexed && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Last indexed: {new Date(currentSettings.last_indexed).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </Tabs.Content>
        
        {/* Folder Settings */}
        <Tabs.Content value="folders" className="py-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Monitored Folders</h2>
            
            <div className="space-y-4">
              {/* Add Folder Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  placeholder="Enter folder path"
                  className="flex-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2"
                />
                <button
                  onClick={handleAddFolder}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                >
                  Add Folder
                </button>
              </div>
              
              {/* Folder List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {currentSettings.monitored_folders.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 italic">
                    No folders added yet. Add folders to begin indexing images.
                  </p>
                ) : (
                  currentSettings.monitored_folders.map((folder, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-md"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FolderIcon size={18} className="text-primary flex-shrink-0" />
                        <span className="truncate text-sm">{folder}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveFolder(folder)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                        title="Remove folder"
                      >
                        <TrashIcon size={16} className="text-red-500" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Note: After adding or removing folders, the system will automatically start indexing images.
              </p>
            </div>
          </div>
        </Tabs.Content>
        
        {/* AI Model Settings */}
        <Tabs.Content value="models" className="py-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">AI Model Settings</h2>
            
            <div className="space-y-6">
              {/* NLP Model Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Text Processing Model (NLP)
                </label>
                <select
                  value={currentSettings.nlp_model}
                  onChange={(e) => handleSettingsUpdate('nlp_model', e.target.value)}
                  className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2"
                >
                  <option value={ModelType.DEFAULT}>Default (Balanced)</option>
                  <option value={ModelType.PERFORMANCE}>Performance (Faster but less accurate)</option>
                  <option value={ModelType.QUALITY}>Quality (Slower but more accurate)</option>
                </select>
              </div>
              
              {/* VLM Model Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Visual Processing Model (VLM)
                </label>
                <select
                  value={currentSettings.vlm_model}
                  onChange={(e) => handleSettingsUpdate('vlm_model', e.target.value)}
                  className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2"
                >
                  <option value={ModelType.DEFAULT}>Default (Balanced)</option>
                  <option value={ModelType.PERFORMANCE}>Performance (Faster but less accurate)</option>
                  <option value={ModelType.QUALITY}>Quality (Slower but more accurate)</option>
                </select>
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Note: Changing models may require reindexing your images for optimal results.
              </p>
            </div>
          </div>
        </Tabs.Content>
        
        {/* Profile Management */}
        <Tabs.Content value="profiles" className="py-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Manage Profiles</h2>
              
              <button
                onClick={() => setIsCreateProfileOpen(true)}
                className="flex items-center gap-1 px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
              >
                <PlusIcon size={16} />
                New Profile
              </button>
            </div>
            
            <div className="space-y-4 mt-4">
              {profiles.map((profile) => (
                <div 
                  key={profile.id}
                  className={`flex items-center justify-between p-4 rounded-md ${
                    profile.id === currentProfile.id 
                      ? 'bg-primary/10 border border-primary/30' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar.Root className="w-10 h-10 rounded-full">
                      {profile.avatar ? (
                        <Avatar.Image 
                          src={profile.avatar} 
                          alt={profile.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <Avatar.Fallback 
                          className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full"
                        >
                          {profile.name.charAt(0).toUpperCase()}
                        </Avatar.Fallback>
                      )}
                    </Avatar.Root>
                    
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {profile.name}
                        {profile.is_default && (
                          <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Last accessed: {new Date(profile.last_accessed).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!profile.is_default && (
                      <button
                        onClick={() => handleSetDefaultProfile(profile.id)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
                        title="Set as default profile"
                      >
                        <CheckIcon size={16} className="text-green-500" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDeleteProfileClick(profile.id)}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
                      title="Delete profile"
                      disabled={profiles.length <= 1}
                    >
                      <TrashIcon size={16} className={profiles.length <= 1 ? "text-gray-400" : "text-red-500"} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Tabs.Content>
      </Tabs.Root>
      
      {/* Create Profile Dialog */}
      <Dialog.Root open={isCreateProfileOpen} onOpenChange={setIsCreateProfileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <Dialog.Title className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Create New Profile
            </Dialog.Title>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profile Name
                </label>
                <input
                  type="text"
                  value={newProfileData.name}
                  onChange={(e) => setNewProfileData({...newProfileData, name: e.target.value})}
                  placeholder="Enter profile name"
                  className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Avatar URL (Optional)
                </label>
                <input
                  type="text"
                  value={newProfileData.avatar}
                  onChange={(e) => setNewProfileData({...newProfileData, avatar: e.target.value})}
                  placeholder="Enter avatar URL (optional)"
                  className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md">
                  Cancel
                </button>
              </Dialog.Close>
              
              <button
                onClick={handleCreateProfile}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                disabled={!newProfileData.name.trim()}
              >
                Create Profile
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default Settings;
