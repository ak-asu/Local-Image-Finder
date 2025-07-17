
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ArrowDownAZ, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import {
  setAlbums,
  setActiveAlbumId,
  toggleAlbumSelection,
} from '@/redux/slices/albumSlice';
import AlbumCard from '@/components/albums/AlbumCard';
import albumService from '@/services/albumService';

const Albums: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const albums = useAppSelector((state) => state.album.albums);
  const selectedAlbumIds = useAppSelector((state) => state.album.selectedAlbumIds);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [filterType, setFilterType] = useState<'all' | 'manual' | 'auto'>('all');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchAlbums = async () => {
      setIsLoading(true);
      try {
        const result = await albumService.getAlbums();
        dispatch(setAlbums(result));
      } catch (error) {
        console.error('Failed to fetch albums:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbums();
  }, [dispatch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleAlbumClick = (albumId: string) => {
    if (isSelectionMode) {
      dispatch(toggleAlbumSelection(albumId));
    } else {
      dispatch(setActiveAlbumId(albumId));
      // Navigate to album details or expand album view
      // navigate(`/albums/${albumId}`);
    }
  };

  const handleCreateAlbum = () => {
    // Implement create album logic
    console.log('Create album');
  };

  const handleSortChange = (value: 'newest' | 'oldest' | 'name') => {
    setSortOrder(value);
    setIsSortDropdownOpen(false);
  };

  const handleFilterChange = (value: 'all' | 'manual' | 'auto') => {
    setFilterType(value);
    setIsFilterDropdownOpen(false);
  };

  // Long press handlers for selection mode
  const handleMouseDown = (albumId: string) => {
    const timer = setTimeout(() => {
      setIsSelectionMode(true);
      dispatch(toggleAlbumSelection(albumId));
    }, 500); // 500ms long press
    
    setLongPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleExitSelectionMode = () => {
    setIsSelectionMode(false);
  };

  const filteredAndSortedAlbums = albums
    .filter((album) => {
      // Filter by search query
      if (searchQuery) {
        const matchesQuery = album.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) || 
          album.description?.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesQuery) return false;
      }
      
      // Filter by type
      if (filterType === 'manual' && album.isAutoCreated) return false;
      if (filterType === 'auto' && !album.isAutoCreated) return false;
      
      return true;
    })
    .sort((a, b) => {
      // Sort by the selected order
      switch (sortOrder) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  return (
    <div className="p-4">
      {/* Selection mode header */}
      {isSelectionMode && (
        <div className="bg-primary/10 p-4 mb-4 rounded-md flex justify-between items-center">
          <div>
            <span className="font-medium">{selectedAlbumIds.length} selected</span>
          </div>
          <div className="flex space-x-2">
            <button className="px-4 py-1 text-sm rounded-md bg-secondary hover:bg-secondary/80">
              Delete
            </button>
            <button className="px-4 py-1 text-sm rounded-md bg-secondary hover:bg-secondary/80">
              Export
            </button>
            <button 
              className="px-4 py-1 text-sm rounded-md bg-secondary hover:bg-secondary/80"
              onClick={handleExitSelectionMode}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Search and Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-grow max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search albums..."
            className="w-full py-2 pl-10 pr-4 rounded-md bg-secondary text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
          />
        </div>

        <div className="flex items-center space-x-2">
          <motion.button
            className="flex items-center space-x-2 p-2 rounded-md bg-primary text-primary-foreground"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreateAlbum}
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Create Album</span>
          </motion.button>

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
                  All albums
                </div>
                <div
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-secondary"
                  onClick={() => handleFilterChange('manual')}
                >
                  Manual albums
                </div>
                <div
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-secondary"
                  onClick={() => handleFilterChange('auto')}
                >
                  Auto albums
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Albums Grid */}
      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="w-8 h-8 border-4 border-primary/50 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : filteredAndSortedAlbums.length === 0 ? (
        <div className="text-center my-12">
          <div className="text-4xl mb-4">📁</div>
          <h3 className="text-lg font-medium">No albums found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'Try a different search term' : 'Create an album to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredAndSortedAlbums.map((album) => (
            <div
              key={album.id}
              onMouseDown={() => handleMouseDown(album.id)}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={() => handleMouseDown(album.id)}
              onTouchEnd={handleMouseUp}
            >
              <AlbumCard
                id={album.id}
                name={album.name}
                description={album.description}
                coverImage={album.coverImage}
                createdAt={album.createdAt}
                onClick={() => handleAlbumClick(album.id)}
                isSelected={selectedAlbumIds.includes(album.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Albums;
