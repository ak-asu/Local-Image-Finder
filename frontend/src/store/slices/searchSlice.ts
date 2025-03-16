import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ImageSearchResult } from '../../types';
import api from '../../utils/api';

interface SearchState {
  results: ImageSearchResult[];
  isSearching: boolean;
  error: string | null;
  searchHistory: {
    query: string;
    timestamp: Date;
  }[];
}

const initialState: SearchState = {
  results: [],
  isSearching: false,
  error: null,
  searchHistory: [],
};

export const searchByText = createAsyncThunk(
  'search/searchByText',
  async ({ query, profileId, saveToHistory = true }: 
    { query: string; profileId: string; saveToHistory?: boolean }) => {
    const formData = new FormData();
    formData.append('query', query);
    formData.append('profile_id', profileId);
    formData.append('save_to_history', saveToHistory.toString());
    
    const response = await api.post('/api/search/text', formData);
    return {
      results: response.data,
      query,
    };
  }
);

export const searchByImage = createAsyncThunk(
  'search/searchByImage',
  async ({ file, profileId, saveToHistory = true }: 
    { file: File; profileId: string; saveToHistory?: boolean }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('profile_id', profileId);
    formData.append('save_to_history', saveToHistory.toString());
    
    const response = await api.post('/api/search/image', formData);
    return {
      results: response.data,
      query: `[Image: ${file.name}]`,
    };
  }
);

export const searchCombined = createAsyncThunk(
  'search/searchCombined',
  async ({ text, files, profileId, saveToHistory = true }: 
    { text: string; files: File[]; profileId: string; saveToHistory?: boolean }) => {
    const formData = new FormData();
    
    if (text) {
      formData.append('text', text);
    }
    
    files.forEach(file => {
      formData.append('files', file);
    });
    
    formData.append('profile_id', profileId);
    formData.append('save_to_history', saveToHistory.toString());
    
    const response = await api.post('/api/search/combined', formData);
    
    const fileNames = files.map(f => f.name).join(', ');
    const queryText = text ? text : '';
    const queryLabel = fileNames ? `${queryText} [Images: ${fileNames}]` : queryText;
    
    return {
      results: response.data,
      query: queryLabel,
    };
  }
);

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    clearSearchResults: (state) => {
      state.results = [];
      state.error = null;
    },
    clearSearchHistory: (state) => {
      state.searchHistory = [];
    },
  },
  extraReducers: (builder) => {
    // Search by text
    builder
      .addCase(searchByText.pending, (state) => {
        state.isSearching = true;
        state.error = null;
      })
      .addCase(searchByText.fulfilled, (state, action) => {
        state.isSearching = false;
        state.results = action.payload.results;
        state.searchHistory.unshift({
          query: action.payload.query,
          timestamp: new Date(),
        });
      })
      .addCase(searchByText.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.error.message || 'Failed to perform text search';
      });

    // Search by image
    builder
      .addCase(searchByImage.pending, (state) => {
        state.isSearching = true;
        state.error = null;
      })
      .addCase(searchByImage.fulfilled, (state, action) => {
        state.isSearching = false;
        state.results = action.payload.results;
        state.searchHistory.unshift({
          query: action.payload.query,
          timestamp: new Date(),
        });
      })
      .addCase(searchByImage.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.error.message || 'Failed to perform image search';
      });

    // Combined search
    builder
      .addCase(searchCombined.pending, (state) => {
        state.isSearching = true;
        state.error = null;
      })
      .addCase(searchCombined.fulfilled, (state, action) => {
        state.isSearching = false;
        state.results = action.payload.results;
        state.searchHistory.unshift({
          query: action.payload.query,
          timestamp: new Date(),
        });
      })
      .addCase(searchCombined.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.error.message || 'Failed to perform combined search';
      });
  },
});

export const { clearSearchResults, clearSearchHistory } = searchSlice.actions;
export default searchSlice.reducer;
