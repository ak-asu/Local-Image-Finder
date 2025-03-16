import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeMode } from '../../types';

interface UiState {
  theme: ThemeMode;
  isSidebarCollapsed: boolean;
  isContextMenuOpen: boolean;
  contextMenuPosition: { x: number; y: number };
  contextMenuItems: { id: string; label: string; icon?: string; action: string }[];
  contextMenuContext: any;
  selectedItems: string[];
  activeModal: string | null;
  modalData: any;
  notifications: {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    duration?: number;
  }[];
}

const initialState: UiState = {
  theme: ThemeMode.SYSTEM,
  isSidebarCollapsed: false,
  isContextMenuOpen: false,
  contextMenuPosition: { x: 0, y: 0 },
  contextMenuItems: [],
  contextMenuContext: null,
  selectedItems: [],
  activeModal: null,
  modalData: null,
  notifications: [],
};

// Helper function to get system theme
const getSystemTheme = (): ThemeMode.LIGHT | ThemeMode.DARK => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? ThemeMode.DARK
      : ThemeMode.LIGHT;
  }
  return ThemeMode.LIGHT;
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.theme = action.payload;
    },
    toggleSidebar: (state) => {
      state.isSidebarCollapsed = !state.isSidebarCollapsed;
    },
    openContextMenu: (state, action: PayloadAction<{
      x: number;
      y: number;
      items: { id: string; label: string; icon?: string; action: string }[];
      context?: any;
    }>) => {
      state.isContextMenuOpen = true;
      state.contextMenuPosition = { x: action.payload.x, y: action.payload.y };
      state.contextMenuItems = action.payload.items;
      state.contextMenuContext = action.payload.context || null;
    },
    closeContextMenu: (state) => {
      state.isContextMenuOpen = false;
      state.contextMenuItems = [];
      state.contextMenuContext = null;
    },
    selectItem: (state, action: PayloadAction<string>) => {
      if (!state.selectedItems.includes(action.payload)) {
        state.selectedItems.push(action.payload);
      }
    },
    deselectItem: (state, action: PayloadAction<string>) => {
      state.selectedItems = state.selectedItems.filter(id => id !== action.payload);
    },
    toggleItemSelection: (state, action: PayloadAction<string>) => {
      const index = state.selectedItems.indexOf(action.payload);
      if (index === -1) {
        state.selectedItems.push(action.payload);
      } else {
        state.selectedItems.splice(index, 1);
      }
    },
    clearSelection: (state) => {
      state.selectedItems = [];
    },
    openModal: (state, action: PayloadAction<{ modalId: string; data?: any }>) => {
      state.activeModal = action.payload.modalId;
      state.modalData = action.payload.data || null;
    },
    closeModal: (state) => {
      state.activeModal = null;
      state.modalData = null;
    },
    addNotification: (state, action: PayloadAction<{
      type: 'info' | 'success' | 'warning' | 'error';
      message: string;
      duration?: number;
      id?: string;
    }>) => {
      const id = action.payload.id || `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      state.notifications.push({
        id,
        type: action.payload.type,
        message: action.payload.message,
        duration: action.payload.duration || 5000,
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  setTheme,
  toggleSidebar,
  openContextMenu,
  closeContextMenu,
  selectItem,
  deselectItem,
  toggleItemSelection,
  clearSelection,
  openModal,
  closeModal,
  addNotification,
  removeNotification,
  clearNotifications,
} = uiSlice.actions;

export default uiSlice.reducer;

// Thunks
export const initializeTheme = () => (dispatch: any, getState: any) => {
  const { settings } = getState();
  const userPreference = settings.currentSettings?.theme_mode || ThemeMode.SYSTEM;
  
  if (userPreference === ThemeMode.SYSTEM) {
    // Apply system theme
    const systemTheme = getSystemTheme();
    document.documentElement.classList.toggle('dark', systemTheme === ThemeMode.DARK);
  } else {
    // Apply user preference
    document.documentElement.classList.toggle('dark', userPreference === ThemeMode.DARK);
  }
  
  dispatch(setTheme(userPreference));
};
