
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

const App = () => {
  // Handler for search action from multiple places in the app
  const handleSearch = () => {
    // For now, there's no navigation needed since the search will be handled by the Chat component
  };

  return (
    <Provider store={store}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout onSearch={handleSearch} />}>
              <Route index element={<Chat />} />
              <Route path="/library" element={<Library />} />
              <Route path="/albums" element={<Albums />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </Provider>
  );
};

export default App;
