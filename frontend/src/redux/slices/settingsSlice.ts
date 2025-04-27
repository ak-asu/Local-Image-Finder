
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FolderLocation {
  id: string;
  path: string;
}

interface ProfileSettings {
  profileId: string;
  similarResultsCount: number;
  folderLocations: FolderLocation[];
  similarityThreshold: number;
  selectedModel: string;
}

interface SettingsState {
  profileSettings: Record<string, ProfileSettings>;
  availableModels: string[];
}

const initialState: SettingsState = {
  profileSettings: {
    default: {
      profileId: 'default',
      similarResultsCount: 5,
      folderLocations: [],
      similarityThreshold: 0.7,
      selectedModel: 'default',
    },
  },
  availableModels: ['default', 'high-precision', 'fast'],
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateProfileSettings: (
      state,
      action: PayloadAction<{ profileId: string; settings: Partial<ProfileSettings> }>
    ) => {
      const { profileId, settings } = action.payload;
      if (state.profileSettings[profileId]) {
        state.profileSettings[profileId] = {
          ...state.profileSettings[profileId],
          ...settings,
        };
      } else {
        state.profileSettings[profileId] = {
          profileId,
          similarResultsCount: 5,
          folderLocations: [],
          similarityThreshold: 0.7,
          selectedModel: 'default',
          ...settings,
        };
      }
    },
    addFolderLocation: (
      state,
      action: PayloadAction<{ profileId: string; location: FolderLocation }>
    ) => {
      const { profileId, location } = action.payload;
      if (state.profileSettings[profileId]) {
        state.profileSettings[profileId].folderLocations.push(location);
      }
    },
    removeFolderLocation: (
      state,
      action: PayloadAction<{ profileId: string; locationId: string }>
    ) => {
      const { profileId, locationId } = action.payload;
      if (state.profileSettings[profileId]) {
        state.profileSettings[profileId].folderLocations = state.profileSettings[
          profileId
        ].folderLocations.filter(loc => loc.id !== locationId);
      }
    },
    setAvailableModels: (state, action: PayloadAction<string[]>) => {
      state.availableModels = action.payload;
    },
  },
});

export const {
  updateProfileSettings,
  addFolderLocation,
  removeFolderLocation,
  setAvailableModels,
} = settingsSlice.actions;

export default settingsSlice.reducer;
