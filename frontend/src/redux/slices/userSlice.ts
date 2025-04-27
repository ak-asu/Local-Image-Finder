
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Profile {
  id: string;
  name: string;
  avatar: string;
}

interface UserState {
  activeProfileId: string | null;
  profiles: Profile[];
}

const initialState: UserState = {
  activeProfileId: null,
  profiles: [
    {
      id: 'default',
      name: 'Default Profile',
      avatar: '/placeholder.svg',
    },
  ],
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setActiveProfile: (state, action: PayloadAction<string>) => {
      state.activeProfileId = action.payload;
    },
    addProfile: (state, action: PayloadAction<Profile>) => {
      state.profiles.push(action.payload);
    },
    updateProfile: (state, action: PayloadAction<Profile>) => {
      const index = state.profiles.findIndex(profile => profile.id === action.payload.id);
      if (index !== -1) {
        state.profiles[index] = action.payload;
      }
    },
    removeProfile: (state, action: PayloadAction<string>) => {
      state.profiles = state.profiles.filter(profile => profile.id !== action.payload);
      if (state.activeProfileId === action.payload) {
        state.activeProfileId = state.profiles[0]?.id || null;
      }
    },
  },
});

export const { setActiveProfile, addProfile, updateProfile, removeProfile } = userSlice.actions;
export default userSlice.reducer;
