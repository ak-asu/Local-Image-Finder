
import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import chatReducer from './slices/chatSlice';
import uiReducer from './slices/uiSlice';
import userReducer from './slices/userSlice';
import albumReducer from './slices/albumSlice';
import libraryReducer from './slices/librarySlice';
import settingsReducer from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    ui: uiReducer,
    user: userReducer,
    album: albumReducer,
    library: libraryReducer,
    settings: settingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Custom hooks for better TypeScript inference
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
