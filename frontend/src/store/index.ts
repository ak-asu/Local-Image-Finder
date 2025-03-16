import { configureStore } from '@reduxjs/toolkit';
import profilesReducer from './slices/profilesSlice';
import searchReducer from './slices/searchSlice';
import sessionReducer from './slices/sessionSlice';
import albumsReducer from './slices/albumsSlice';
import settingsReducer from './slices/settingsSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    profiles: profilesReducer,
    search: searchReducer,
    session: sessionReducer,
    albums: albumsReducer,
    settings: settingsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types as they may contain non-serializable data like File objects
        ignoredActions: ['search/searchByImage/pending', 'search/searchCombined/pending'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
