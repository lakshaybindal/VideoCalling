import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: 'light',
    chatOpen: false,
    settingsOpen: false,
    adminPanelOpen: false,
    notifications: [],
    isFullscreen: false,
    sidebarOpen: false,
  },
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    toggleChat: (state) => {
      state.chatOpen = !state.chatOpen;
    },
    setChatOpen: (state, action) => {
      state.chatOpen = action.payload;
    },
    toggleSettings: (state) => {
      state.settingsOpen = !state.settingsOpen;
    },
    setSettingsOpen: (state, action) => {
      state.settingsOpen = action.payload;
    },
    toggleAdminPanel: (state) => {
      state.adminPanelOpen = !state.adminPanelOpen;
    },
    setAdminPanelOpen: (state, action) => {
      state.adminPanelOpen = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        ...action.payload,
        timestamp: new Date().toISOString(),
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setFullscreen: (state, action) => {
      state.isFullscreen = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  toggleChat,
  setChatOpen,
  toggleSettings,
  setSettingsOpen,
  toggleAdminPanel,
  setAdminPanelOpen,
  addNotification,
  removeNotification,
  clearNotifications,
  setFullscreen,
  toggleSidebar,
  setSidebarOpen,
} = uiSlice.actions;

export default uiSlice.reducer;
