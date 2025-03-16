import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Profile } from '../../types';
import api from '../../utils/api';

interface ProfilesState {
  profiles: Profile[];
  currentProfile: Profile | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProfilesState = {
  profiles: [],
  currentProfile: null,
  isLoading: false,
  error: null,
};

export const fetchProfiles = createAsyncThunk(
  'profiles/fetchProfiles',
  async () => {
    const response = await api.get('/api/profiles/');
    return response.data;
  }
);

export const createProfile = createAsyncThunk(
  'profiles/createProfile',
  async (profileData: { name: string; avatar?: string }) => {
    const response = await api.post('/api/profiles/', profileData);
    return response.data;
  }
);

export const updateProfile = createAsyncThunk(
  'profiles/updateProfile',
  async ({ profileId, data }: { profileId: string; data: Partial<Profile> }) => {
    const response = await api.patch(`/api/profiles/${profileId}`, data);
    return response.data;
  }
);

export const deleteProfile = createAsyncThunk(
  'profiles/deleteProfile',
  async (profileId: string) => {
    await api.delete(`/api/profiles/${profileId}`);
    return profileId;
  }
);

export const setDefaultProfile = createAsyncThunk(
  'profiles/setDefaultProfile',
  async (profileId: string) => {
    await api.put(`/api/profiles/${profileId}/default`);
    return profileId;
  }
);

const profilesSlice = createSlice({
  name: 'profiles',
  initialState,
  reducers: {
    setCurrentProfile: (state, action: PayloadAction<Profile>) => {
      state.currentProfile = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch profiles
      .addCase(fetchProfiles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProfiles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profiles = action.payload;
      })
      .addCase(fetchProfiles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch profiles';
      })
      
      // Create profile
      .addCase(createProfile.fulfilled, (state, action) => {
        state.profiles.push(action.payload);
      })
      
      // Update profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        const index = state.profiles.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.profiles[index] = action.payload;
          
          // Update currentProfile if it was the one that was updated
          if (state.currentProfile && state.currentProfile.id === action.payload.id) {
            state.currentProfile = action.payload;
          }
        }
      })
      
      // Delete profile
      .addCase(deleteProfile.fulfilled, (state, action) => {
        state.profiles = state.profiles.filter(p => p.id !== action.payload);
        
        // If current profile was deleted, set to null
        if (state.currentProfile && state.currentProfile.id === action.payload) {
          const defaultProfile = state.profiles.find(p => p.is_default) || state.profiles[0] || null;
          state.currentProfile = defaultProfile;
        }
      })
      
      // Set default profile
      .addCase(setDefaultProfile.fulfilled, (state, action) => {
        state.profiles = state.profiles.map(profile => ({
          ...profile,
          is_default: profile.id === action.payload
        }));
      });
  },
});

export const { setCurrentProfile } = profilesSlice.actions;
export default profilesSlice.reducer;
