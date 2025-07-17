import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ArrowDownAZ, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import {
  setSessions,
  setActiveSessionId,
  setSearchQuery,
  setSortOrder,
  setFilterType,
  removeSession,
} from '@/redux/slices/librarySlice';
import { setActiveSearchId } from '@/redux/slices/chatSlice';
import SessionCard from '@/components/library/SessionCard';
import sessionService from '@/services/sessionService';

const Library: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const sessions = useAppSelector((state) => state.library.sessions);
  const searchQuery = useAppSelector((state) => state.library.searchQuery);
  const sortOrder = useAppSelector((state) => state.library.sortOrder);
  const filterType = useAppSelector((state) => state.library.filterType);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      try {
        const result = await sessionService.getSessions();
        dispatch(setSessions(result));
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [dispatch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchQuery(e.target.value));
  };

  const handleSessionClick = (sessionId: string) => {
    dispatch(setActiveSessionId(sessionId));
    dispatch(setActiveSearchId(sessionId));
    navigate('/');
  };

  const handleSaveSession = (id: string) => {
    // Implement save logic
    console.log('Save session:', id);
  };

  const handleExportSession = (id: string) => {
    // Implement export logic
    console.log('Export session:', id);
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await sessionService.deleteSession(id);
      dispatch(removeSession(id));
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleSortChange = (value: 'newest' | 'oldest' | 'name') => {
    dispatch(setSortOrder(value));
    setIsSortDropdownOpen(false);
  };

  const handleFilterChange = (value: 'all' | 'text' | 'image') => {
    dispatch(setFilterType(value));
    setIsFilterDropdownOpen(false);
  };

  const filteredAndSortedSessions = Array.isArray(sessions) 
    ? sessions
        .filter((session) => {
          // Filter by search query
          if (searchQuery) {
            const matchesQuery = session.name
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) || 
              session.query?.toLowerCase().includes(searchQuery.toLowerCase());
            
            if (!matchesQuery) return false;
          }
          
          // Filter by type
          if (filterType === 'text' && session.queryImage) return false;
          if (filterType === 'image' && !session.queryImage) return false;
          
          return true;
        })
        .sort((a, b) => {
          // Sort by the selected order
          switch (sortOrder) {
            case 'newest':
              return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            case 'oldest':
              return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            case 'name':
              return a.name.localeCompare(b.name);
            default:
              return 0;
          }
        })
    : [];

  return (
    <div className="p-4">
      {/* Search and Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-grow max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search sessions..."
            className="w-full py-2 pl-10 pr-4 rounded-md bg-secondary text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
          />
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <motion.button
              className="flex items-center space-x-2 p-2 rounded-md bg-secondary hover:bg-secondary/80 text-foreground"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
            >
              <ArrowDownAZ size={18} />
              <span className="hidden sm:inline">Sort</span>
            </motion.button>
            
            {isSortDropdownOpen && (
              <div className="absolute right-0 mt-1 w-40 bg-popover rounded-md shadow-lg z-10 border border-border">
                <div
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-secondary"
                  onClick={() => handleSortChange('newest')}
                >
                  Newest first
                </div>
                <div
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-secondary"
                  onClick={() => handleSortChange('oldest')}
                >
                  Oldest first
                </div>
                <div
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-secondary"
                  onClick={() => handleSortChange('name')}
                >
                  By name
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <motion.button
              className="flex items-center space-x-2 p-2 rounded-md bg-secondary hover:bg-secondary/80 text-foreground"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            >
              <Filter size={18} />
              <span className="hidden sm:inline">Filter</span>
            </motion.button>
            
            {isFilterDropdownOpen && (
              <div className="absolute right-0 mt-1 w-40 bg-popover rounded-md shadow-lg z-10 border border-border">
                <div
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-secondary"
                  onClick={() => handleFilterChange('all')}
                >
                  All sessions
                </div>
                <div
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-secondary"
                  onClick={() => handleFilterChange('text')}
                >
                  Text queries
                </div>
                <div
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-secondary"
                  onClick={() => handleFilterChange('image')}
                >
                  Image queries
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sessions Grid */}
      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="w-8 h-8 border-4 border-primary/50 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : filteredAndSortedSessions.length === 0 ? (
        <div className="text-center my-12">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium">No sessions found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'Try a different search term' : 'Start by searching for images'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAndSortedSessions.map((session) => (
            <SessionCard
              key={session.id}
              id={session.id}
              name={session.name}
              timestamp={session.timestamp}
              thumbnails={session.thumbnails}
              onClick={() => handleSessionClick(session.id)}
              onSave={() => handleSaveSession(session.id)}
              onExport={() => handleExportSession(session.id)}
              onDelete={() => handleDeleteSession(session.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Library;
