import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Session } from '../../types';
import api from '../../utils/api';

interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SessionState = {
  sessions: [],
  currentSession: null,
  isLoading: false,
  error: null,
};

export const fetchSessions = createAsyncThunk(
  'session/fetchSessions',
  async (profileId: string) => {
    const response = await api.get(`/api/library/sessions/${profileId}`);
    return response.data;
  }
);

export const getSession = createAsyncThunk(
  'session/getSession',
  async ({ profileId, sessionId }: { profileId: string; sessionId: string }) => {
    const response = await api.get(`/api/library/sessions/${profileId}/${sessionId}`);
    return response.data;
  }
);

export const createNewSession = createAsyncThunk(
  'session/createNewSession',
  async (profileId: string) => {
    // Create an empty session
    const emptySession: Partial<Session> = {
      profile_id: profileId,
      queries: [],
      result_ids: [],
    };
    
    const response = await api.post(`/api/library/sessions/${profileId}`, emptySession);
    return response.data;
  }
);

export const updateSession = createAsyncThunk(
  'session/updateSession',
  async ({ profileId, sessionId, data }: 
    { profileId: string; sessionId: string; data: Partial<Session> }) => {
    const response = await api.patch(
      `/api/library/sessions/${profileId}/${sessionId}`, 
      data
    );
    return response.data;
  }
);

export const deleteSession = createAsyncThunk(
  'session/deleteSession',
  async ({ profileId, sessionId }: { profileId: string; sessionId: string }) => {
    await api.delete(`/api/library/sessions/${profileId}/${sessionId}`);
    return sessionId;
  }
);

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setCurrentSession: (state, action) => {
      state.currentSession = action.payload;
    },
    clearCurrentSession: (state) => {
      state.currentSession = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch sessions
    builder
      .addCase(fetchSessions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessions = action.payload;
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch sessions';
      });
      
    // Get session
    builder
      .addCase(getSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSession = action.payload;
      })
      .addCase(getSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch session';
      });
      
    // Create new session
    builder
      .addCase(createNewSession.fulfilled, (state, action) => {
        state.sessions.unshift(action.payload);
        state.currentSession = action.payload;
      });
      
    // Update session
    builder
      .addCase(updateSession.fulfilled, (state, action) => {
        const index = state.sessions.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.sessions[index] = action.payload;
        }
        
        if (state.currentSession && state.currentSession.id === action.payload.id) {
          state.currentSession = action.payload;
        }
      });
      
    // Delete session
    builder
      .addCase(deleteSession.fulfilled, (state, action) => {
        state.sessions = state.sessions.filter(s => s.id !== action.payload);
        
        if (state.currentSession && state.currentSession.id === action.payload) {
          state.currentSession = null;
        }
      });
  },
});

export const { setCurrentSession, clearCurrentSession } = sessionSlice.actions;
export default sessionSlice.reducer;
