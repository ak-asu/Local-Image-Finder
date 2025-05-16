
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import MainLayout from './components/layouts/MainLayout';
import Chat from './pages/Chat';
import Library from './pages/Library';
import Albums from './pages/Albums';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import { ThemeProvider } from './contexts/ThemeContext';

// Move keyboard shortcuts inside the components that are within Router
const AppRoutes = () => {
  // Handler for search action from multiple places in the app
  const handleSearch = () => {
    // Forward to the active page component
    const event = new CustomEvent('app:search');
    window.dispatchEvent(event);
  };

  return (
    <Routes>
      <Route path="/" element={<MainLayout onSearch={handleSearch} />}>
        <Route index element={<Chat />} />
        <Route path="/library" element={<Library />} />
        <Route path="/albums" element={<Albums />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const AppContent = () => {
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </Provider>
  );
};

export default App;
