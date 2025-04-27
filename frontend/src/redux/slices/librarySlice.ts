
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Session {
  id: string;
  name: string;
  query: string;
  queryImage?: string;
  timestamp: string;
  thumbnails: string[];
}

interface LibraryState {
  sessions: Session[];
  activeSessionId: string | null;
  selectedSessionIds: string[];
  searchQuery: string;
  sortOrder: 'newest' | 'oldest' | 'name';
  filterType: 'all' | 'text' | 'image';
}

const initialState: LibraryState = {
  sessions: [],
  activeSessionId: null,
  selectedSessionIds: [],
  searchQuery: '',
  sortOrder: 'newest',
  filterType: 'all',
};

const librarySlice = createSlice({
  name: 'library',
  initialState,
  reducers: {
    setSessions: (state, action: PayloadAction<Session[]>) => {
      state.sessions = action.payload;
    },
    addSession: (state, action: PayloadAction<Session>) => {
      state.sessions.unshift(action.payload);
    },
    updateSession: (state, action: PayloadAction<Session>) => {
      const index = state.sessions.findIndex(session => session.id === action.payload.id);
      if (index !== -1) {
        state.sessions[index] = action.payload;
      }
    },
    removeSession: (state, action: PayloadAction<string>) => {
      state.sessions = state.sessions.filter(session => session.id !== action.payload);
      if (state.activeSessionId === action.payload) {
        state.activeSessionId = null;
      }
    },
    setActiveSessionId: (state, action: PayloadAction<string | null>) => {
      state.activeSessionId = action.payload;
    },
    selectSession: (state, action: PayloadAction<string>) => {
      if (!state.selectedSessionIds.includes(action.payload)) {
        state.selectedSessionIds.push(action.payload);
      }
    },
    deselectSession: (state, action: PayloadAction<string>) => {
      state.selectedSessionIds = state.selectedSessionIds.filter(id => id !== action.payload);
    },
    clearSessionSelection: (state) => {
      state.selectedSessionIds = [];
    },
    toggleSessionSelection: (state, action: PayloadAction<string>) => {
      const index = state.selectedSessionIds.indexOf(action.payload);
      if (index === -1) {
        state.selectedSessionIds.push(action.payload);
      } else {
        state.selectedSessionIds.splice(index, 1);
      }
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSortOrder: (state, action: PayloadAction<'newest' | 'oldest' | 'name'>) => {
      state.sortOrder = action.payload;
    },
    setFilterType: (state, action: PayloadAction<'all' | 'text' | 'image'>) => {
      state.filterType = action.payload;
    },
  },
});

export const {
  setSessions,
  addSession,
  updateSession,
  removeSession,
  setActiveSessionId,
  selectSession,
  deselectSession,
  clearSessionSelection,
  toggleSessionSelection,
  setSearchQuery,
  setSortOrder,
  setFilterType,
} = librarySlice.actions;

export default librarySlice.reducer;
