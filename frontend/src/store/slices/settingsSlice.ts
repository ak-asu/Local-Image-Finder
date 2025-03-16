import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ProfileSettings } from '../../types';
import api from '../../utils/api';

interface SettingsState {
  currentSettings: ProfileSettings | null;
  isLoading: boolean;
  error: string | null;
  validationResults: Record<string, boolean>;
}

const initialState: SettingsState = {
  currentSettings: null,
  isLoading: false,
  error: null,
  validationResults: {},
};

export const fetchSettings = createAsyncThunk(
  'settings/fetchSettings',
  async (profileId: string) => {
    const response = await api.get(`/api/settings/${profileId}`);
    return response.data;
  }
);

export const updateSettings = createAsyncThunk(
  'settings/updateSettings',
  async ({ profileId, settings }: { profileId: string; settings: Partial<ProfileSettings> }) => {
    const response = await api.patch(`/api/settings/${profileId}`, settings);
    return response.data;
  }
);

export const validateFolders = createAsyncThunk(
  'settings/validateFolders',
  async (folders: string[]) => {
    const response = await api.post('/api/settings/folders/validate', { folders });
    return response.data;
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    resetValidationResults: (state) => {
      state.validationResults = {};
    },
  },
  extraReducers: (builder) => {
    // Fetch settings
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSettings = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch settings';
      });
      
    // Update settings
    builder
      .addCase(updateSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSettings = action.payload;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to update settings';
      });
      
    // Validate folders
    builder
      .addCase(validateFolders.fulfilled, (state, action) => {
        state.validationResults = action.payload;
      });
  },
});

export const { resetValidationResults } = settingsSlice.actions;
export default settingsSlice.reducer;
