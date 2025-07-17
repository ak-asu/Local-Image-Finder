
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SearchResult {
  id: string;
  path: string;
  score?: number;
  imagePath?: string;
  metadata?: Record<string, any>;
}

interface SearchSection {
  id: string;
  query: string;
  queryImage?: string;
  primaryResult?: {
    id: string;
    path: string;
  };
  relatedResults: {
    id: string;
    path: string;
  }[];
  timestamp: string;
}

interface ChatState {
  currentQuery: string;
  queryImage: string | null;
  searchHistory: SearchSection[];
  activeSearchId: string | null;
}

const initialState: ChatState = {
  currentQuery: '',
  queryImage: null,
  searchHistory: [],
  activeSearchId: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setCurrentQuery: (state, action: PayloadAction<string>) => {
      state.currentQuery = action.payload;
    },
    setQueryImage: (state, action: PayloadAction<string | null>) => {
      state.queryImage = action.payload;
    },
    addSearchSection: (state, action: PayloadAction<SearchSection>) => {
      state.searchHistory.unshift(action.payload);
      state.activeSearchId = action.payload.id;
    },
    clearCurrentQuery: (state) => {
      state.currentQuery = '';
      state.queryImage = null;
    },
    setActiveSearchId: (state, action: PayloadAction<string>) => {
      state.activeSearchId = action.payload;
    },
    removeSearchSection: (state, action: PayloadAction<string>) => {
      state.searchHistory = state.searchHistory.filter(
        section => section.id !== action.payload
      );
      if (state.activeSearchId === action.payload) {
        state.activeSearchId = state.searchHistory[0]?.id || null;
      }
    },
  },
});

export const {
  setCurrentQuery,
  setQueryImage,
  addSearchSection,
  clearCurrentQuery,
  setActiveSearchId,
  removeSearchSection,
} = chatSlice.actions;

export default chatSlice.reducer;
