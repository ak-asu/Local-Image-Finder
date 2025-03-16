import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Album, AlbumType } from '../../types';
import api from '../../utils/api';

interface AlbumsState {
  albums: Album[];
  currentAlbum: Album | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AlbumsState = {
  albums: [],
  currentAlbum: null,
  isLoading: false,
  error: null,
};

export const fetchAlbums = createAsyncThunk(
  'albums/fetchAlbums',
  async ({ 
    profileId, 
    albumType, 
    searchTerm, 
    sortBy, 
    sortOrder 
  }: { 
    profileId: string; 
    albumType?: AlbumType; 
    searchTerm?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    let url = `/api/albums/${profileId}?`;
    
    if (albumType) url += `album_type=${albumType}&`;
    if (searchTerm) url += `search_term=${encodeURIComponent(searchTerm)}&`;
    if (sortBy) url += `sort_by=${sortBy}&`;
    if (sortOrder) url += `sort_order=${sortOrder}&`;
    
    const response = await api.get(url);
    return response.data;
  }
);

export const getAlbum = createAsyncThunk(
  'albums/getAlbum',
  async ({ profileId, albumId }: { profileId: string; albumId: string }) => {
    const response = await api.get(`/api/albums/${profileId}/${albumId}`);
    return response.data;
  }
);

export const createAlbum = createAsyncThunk(
  'albums/createAlbum',
  async ({ 
    profileId, 
    albumData 
  }: { 
    profileId: string; 
    albumData: {
      name: string;
      description?: string;
      type: AlbumType;
      search_query?: string;
      cover_image_id?: string;
      result_limit?: number;
      folders_to_search?: string[];
    }
  }) => {
    const response = await api.post(`/api/albums/${profileId}`, albumData);
    return response.data;
  }
);

export const updateAlbum = createAsyncThunk(
  'albums/updateAlbum',
  async ({ 
    profileId, 
    albumId, 
    data 
  }: { 
    profileId: string; 
    albumId: string; 
    data: Partial<Album> 
  }) => {
    const response = await api.patch(`/api/albums/${profileId}/${albumId}`, data);
    return response.data;
  }
);

export const deleteAlbum = createAsyncThunk(
  'albums/deleteAlbum',
  async ({ profileId, albumId }: { profileId: string; albumId: string }) => {
    await api.delete(`/api/albums/${profileId}/${albumId}`);
    return albumId;
  }
);

export const addImageToAlbum = createAsyncThunk(
  'albums/addImageToAlbum',
  async ({ 
    profileId, 
    albumId, 
    imageId 
  }: { 
    profileId: string; 
    albumId: string; 
    imageId: string 
  }) => {
    const response = await api.post(`/api/albums/${profileId}/${albumId}/images/${imageId}`);
    return response.data;
  }
);

export const removeImageFromAlbum = createAsyncThunk(
  'albums/removeImageFromAlbum',
  async ({ 
    profileId, 
    albumId, 
    imageId 
  }: { 
    profileId: string; 
    albumId: string; 
    imageId: string 
  }) => {
    const response = await api.delete(`/api/albums/${profileId}/${albumId}/images/${imageId}`);
    return response.data;
  }
);

export const reorderAlbumImages = createAsyncThunk(
  'albums/reorderAlbumImages',
  async ({ 
    profileId, 
    albumId, 
    orders 
  }: { 
    profileId: string; 
    albumId: string; 
    orders: { image_id: string; order: number }[] 
  }) => {
    const response = await api.put(`/api/albums/${profileId}/${albumId}/order`, orders);
    return response.data;
  }
);

const albumsSlice = createSlice({
  name: 'albums',
  initialState,
  reducers: {
    clearCurrentAlbum: (state) => {
      state.currentAlbum = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch albums
    builder
      .addCase(fetchAlbums.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAlbums.fulfilled, (state, action) => {
        state.isLoading = false;
        state.albums = action.payload;
      })
      .addCase(fetchAlbums.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch albums';
      });
      
    // Get album
    builder
      .addCase(getAlbum.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAlbum.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentAlbum = action.payload;
      })
      .addCase(getAlbum.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch album';
      });
      
    // Create album
    builder
      .addCase(createAlbum.fulfilled, (state, action) => {
        state.albums.unshift(action.payload);
        state.currentAlbum = action.payload;
      });
      
    // Update album
    builder
      .addCase(updateAlbum.fulfilled, (state, action) => {
        const index = state.albums.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.albums[index] = action.payload;
        }
        
        if (state.currentAlbum && state.currentAlbum.id === action.payload.id) {
          state.currentAlbum = action.payload;
        }
      });
      
    // Delete album
    builder
      .addCase(deleteAlbum.fulfilled, (state, action) => {
        state.albums = state.albums.filter(a => a.id !== action.payload);
        
        if (state.currentAlbum && state.currentAlbum.id === action.payload) {
          state.currentAlbum = null;
        }
      });
      
    // Add image to album, remove image from album, reorder images
    builder
      .addCase(addImageToAlbum.fulfilled, (state, action) => {
        if (state.currentAlbum && state.currentAlbum.id === action.payload.id) {
          state.currentAlbum = action.payload;
        }
        
        const index = state.albums.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.albums[index] = action.payload;
        }
      })
      .addCase(removeImageFromAlbum.fulfilled, (state, action) => {
        if (state.currentAlbum && state.currentAlbum.id === action.payload.id) {
          state.currentAlbum = action.payload;
        }
        
        const index = state.albums.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.albums[index] = action.payload;
        }
      })
      .addCase(reorderAlbumImages.fulfilled, (state, action) => {
        if (state.currentAlbum && state.currentAlbum.id === action.payload.id) {
          state.currentAlbum = action.payload;
        }
        
        const index = state.albums.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.albums[index] = action.payload;
        }
      });
  },
});

export const { clearCurrentAlbum } = albumsSlice.actions;
export default albumsSlice.reducer;
