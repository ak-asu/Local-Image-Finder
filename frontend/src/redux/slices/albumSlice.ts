
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Image {
  id: string;
  path: string;
  metadata?: Record<string, any>;
}

interface Album {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  createdAt: string;
  isAutoCreated: boolean;
  images: Image[];
}

interface AlbumState {
  albums: Album[];
  activeAlbumId: string | null;
  selectedAlbumIds: string[];
}

const initialState: AlbumState = {
  albums: [],
  activeAlbumId: null,
  selectedAlbumIds: [],
};

const albumSlice = createSlice({
  name: 'album',
  initialState,
  reducers: {
    setAlbums: (state, action: PayloadAction<Album[]>) => {
      state.albums = action.payload;
    },
    addAlbum: (state, action: PayloadAction<Album>) => {
      state.albums.push(action.payload);
    },
    updateAlbum: (state, action: PayloadAction<Album>) => {
      const index = state.albums.findIndex(album => album.id === action.payload.id);
      if (index !== -1) {
        state.albums[index] = action.payload;
      }
    },
    removeAlbum: (state, action: PayloadAction<string>) => {
      state.albums = state.albums.filter(album => album.id !== action.payload);
      if (state.activeAlbumId === action.payload) {
        state.activeAlbumId = null;
      }
    },
    setActiveAlbumId: (state, action: PayloadAction<string | null>) => {
      state.activeAlbumId = action.payload;
    },
    selectAlbum: (state, action: PayloadAction<string>) => {
      if (!state.selectedAlbumIds.includes(action.payload)) {
        state.selectedAlbumIds.push(action.payload);
      }
    },
    deselectAlbum: (state, action: PayloadAction<string>) => {
      state.selectedAlbumIds = state.selectedAlbumIds.filter(id => id !== action.payload);
    },
    clearAlbumSelection: (state) => {
      state.selectedAlbumIds = [];
    },
    toggleAlbumSelection: (state, action: PayloadAction<string>) => {
      const index = state.selectedAlbumIds.indexOf(action.payload);
      if (index === -1) {
        state.selectedAlbumIds.push(action.payload);
      } else {
        state.selectedAlbumIds.splice(index, 1);
      }
    },
  },
});

export const {
  setAlbums,
  addAlbum,
  updateAlbum,
  removeAlbum,
  setActiveAlbumId,
  selectAlbum,
  deselectAlbum,
  clearAlbumSelection,
  toggleAlbumSelection,
} = albumSlice.actions;

export default albumSlice.reducer;
