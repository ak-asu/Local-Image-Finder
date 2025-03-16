import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from './store';
import { fetchProfiles, setCurrentProfile } from './store/slices/profilesSlice';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import Home from './pages/Home';
import Library from './pages/Library';
import Albums from './pages/Albums';
import AlbumView from './pages/AlbumView';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { profiles, currentProfile, isLoading } = useSelector((state: RootState) => state.profiles);
  
  // Fetch profiles on app load
  useEffect(() => {
    dispatch(fetchProfiles());
  }, [dispatch]);
  
  // Set default profile if available and none selected
  useEffect(() => {
    if (!isLoading && profiles.length > 0 && !currentProfile) {
      const defaultProfile = profiles.find(p => p.is_default) || profiles[0];
      dispatch(setCurrentProfile(defaultProfile));
    }
  }, [isLoading, profiles, currentProfile, dispatch]);

  if (isLoading && profiles.length === 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="library" element={<Library />} />
          <Route path="albums" element={<Albums />} />
          <Route path="albums/:albumId" element={<AlbumView />} />
          <Route path="settings" element={<Settings />} />
          <Route path="404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
