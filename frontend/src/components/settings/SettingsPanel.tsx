
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Trash } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/redux/store';
import { updateProfileSettings, addFolderLocation, removeFolderLocation } from '@/redux/slices/settingsSlice';

interface SettingsPanelProps {
  profileId: string;
  profileName: string;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ profileId, profileName }) => {
  const dispatch = useAppDispatch();
  const [isExpanded, setIsExpanded] = useState(false);
  const [newFolderPath, setNewFolderPath] = useState('');
  
  const profileSettings = useAppSelector(
    (state) => state.settings.profileSettings[profileId]
  );
  
  const availableModels = useAppSelector((state) => state.settings.availableModels);
  
  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  const handleResultCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1) {
      dispatch(
        updateProfileSettings({
          profileId,
          settings: { similarResultsCount: value },
        })
      );
    }
  };
  
  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 1) {
      dispatch(
        updateProfileSettings({
          profileId,
          settings: { similarityThreshold: value },
        })
      );
    }
  };
  
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(
      updateProfileSettings({
        profileId,
        settings: { selectedModel: e.target.value },
      })
    );
  };
  
  const handleAddFolder = () => {
    if (newFolderPath.trim()) {
      dispatch(
        addFolderLocation({
          profileId,
          location: { id: Date.now().toString(), path: newFolderPath },
        })
      );
      setNewFolderPath('');
    }
  };
  
  const handleRemoveFolder = (locationId: string) => {
    dispatch(
      removeFolderLocation({
        profileId,
        locationId,
      })
    );
  };

  return (
    <div className="mb-4 border border-border rounded-lg">
      <div
        className="p-4 flex items-center justify-between cursor-pointer bg-card"
        onClick={handleToggleExpand}
      >
        <h3 className="font-medium">{profileName}</h3>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={20} />
        </motion.div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-4 border-t border-border">
              {/* Similar results count setting */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Similar images to show
                </label>
                <input
                  type="number"
                  value={profileSettings?.similarResultsCount || 5}
                  onChange={handleResultCountChange}
                  min="1"
                  className="w-full p-2 rounded-md border border-input bg-transparent"
                />
              </div>

              {/* Similarity threshold setting */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Similarity threshold (0-1)
                </label>
                <input
                  type="number"
                  value={profileSettings?.similarityThreshold || 0.7}
                  onChange={handleThresholdChange}
                  min="0"
                  max="1"
                  step="0.05"
                  className="w-full p-2 rounded-md border border-input bg-transparent"
                />
              </div>

              {/* Model selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Selected model
                </label>
                <select
                  value={profileSettings?.selectedModel || 'default'}
                  onChange={handleModelChange}
                  className="w-full p-2 rounded-md border border-input bg-transparent"
                >
                  {availableModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>

              {/* Folder locations */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Folder locations
                </label>
                <div className="space-y-2 mb-2">
                  {profileSettings?.folderLocations.map((location) => (
                    <div key={location.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <span className="text-sm truncate mr-2 flex-grow">{location.path}</span>
                      <button
                        className="p-1 rounded-full hover:bg-muted-foreground/20"
                        onClick={() => handleRemoveFolder(location.id)}
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                  {profileSettings?.folderLocations.length === 0 && (
                    <div className="text-sm text-muted-foreground">No folders added</div>
                  )}
                </div>
                <div className="flex items-center mt-2">
                  <input
                    type="text"
                    value={newFolderPath}
                    onChange={(e) => setNewFolderPath(e.target.value)}
                    placeholder="Enter folder path"
                    className="flex-grow p-2 rounded-md border border-input bg-transparent mr-2"
                  />
                  <button
                    className="p-2 rounded-md bg-primary text-primary-foreground"
                    onClick={handleAddFolder}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPanel;
