import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { addSearchSection, clearCurrentQuery } from '@/redux/slices/chatSlice';
import { setLoading } from '@/redux/slices/uiSlice';
import { addSession } from '@/redux/slices/librarySlice';
import SearchResult from '@/components/chat/SearchResult';
import chatService from '@/services/chatService';
import sessionService from '@/services/sessionService';
import { toast } from '@/hooks/use-toast';

const Chat: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentQuery = useAppSelector((state) => state.chat.currentQuery);
  const queryImage = useAppSelector((state) => state.chat.queryImage);
  const searchHistory = useAppSelector((state) => state.chat.searchHistory);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Get active profile settings
  const activeProfileId = useAppSelector((state) => state.user.activeProfileId || 'default');
  const profileSettings = useAppSelector((state) => state.settings.profileSettings[activeProfileId]);

  // Listen for search events
  useEffect(() => {
    const handleSearchEvent = () => {
      if (currentQuery || queryImage) {
        handleSearch();
      }
    };

    window.addEventListener('app:search', handleSearchEvent);
    
    return () => {
      window.removeEventListener('app:search', handleSearchEvent);
    };
  }, [currentQuery, queryImage]);

  const handleSearch = async () => {
    if (!currentQuery && !queryImage) return;
    
    try {
      setSearchError(null);
      dispatch(setLoading(true));
      
      // Make API call to search
      const result = await chatService.search({
        query: currentQuery,
        image: queryImage,
        limit: profileSettings?.similarResultsCount || 5,
        model: profileSettings?.selectedModel,
        threshold: profileSettings?.similarityThreshold,
      });
      
      // Generate unique ID for this search section
      const searchId = uuidv4();
      
      // Add search section to history
      dispatch(
        addSearchSection({
          id: searchId,
          query: currentQuery || 'Image search',
          queryImage: queryImage || undefined,
          primaryResult: result.primaryResult ? {
            id: result.primaryResult.id,
            path: result.primaryResult.imagePath
          } : undefined,
          relatedResults: result.relatedResults.map(img => ({
            id: img.id,
            path: img.imagePath
          })),
          timestamp: new Date().toISOString(),
        })
      );
      
      // Auto-save to library
      const sessionName = currentQuery 
        ? currentQuery.slice(0, 20) 
        : 'Image search';
      
      const thumbnails = [
        result.primaryResult?.imagePath,
        ...(result.relatedResults.slice(0, 2).map(img => img.imagePath)),
      ].filter(Boolean) as string[];
      
      const session = {
        id: searchId,
        name: sessionName,
        query: currentQuery,
        queryImage: queryImage || undefined,
        timestamp: new Date().toISOString(),
        thumbnails,
      };
      
      dispatch(addSession(session));
      
      // Try to save session to backend
      try {
        await sessionService.saveSession({
          name: sessionName,
          query: currentQuery,
          queryImage: queryImage || undefined,
          timestamp: new Date().toISOString(),
          thumbnails,
        });
        toast({
          title: "Session saved",
          description: "Your search session has been saved to the library",
        });
      } catch (e) {
        console.error('Failed to save session:', e);
        toast({
          variant: "destructive",
          title: "Save error",
          description: "Failed to save session to backend",
        });
      }
      
      // Clear current query
      dispatch(clearCurrentQuery());
      
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Failed to perform search. Please try again.');
      toast({
        variant: "destructive",
        title: "Search failed",
        description: "Could not complete the search. Please try again.",
      });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const getPlaceholderContent = () => {
    if (searchHistory.length === 0) {
      return (
        <motion.div
          className="flex flex-col items-center justify-center h-full text-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
          <h2 className="text-xl font-medium mb-2">What image do you want to find?</h2>
          <p className="text-muted-foreground max-w-md">
            Enter a text description or upload an image to search for similar images in your collection.
            Press <kbd className="px-2 py-1 bg-secondary rounded text-xs">Ctrl+F</kbd> to focus the search box or <kbd className="px-2 py-1 bg-secondary rounded text-xs">Ctrl+Enter</kbd> to search.
          </p>
        </motion.div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto p-4">
        {getPlaceholderContent()}

        <AnimatePresence>
          {searchError && (
            <motion.div
              className="bg-destructive/10 text-destructive p-4 rounded-md mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {searchError}
            </motion.div>
          )}
        </AnimatePresence>

        {searchHistory.map((section) => (
          <SearchResult
            key={section.id}
            query={section.query}
            queryImage={section.queryImage}
            primaryImage={section.primaryResult}
            relatedImages={section.relatedResults}
          />
        ))}
      </div>
    </div>
  );
};

export default Chat;
