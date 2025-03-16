import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchAlbums, deleteAlbum } from '../store/slices/albumsSlice';
import { Album, AlbumType } from '../types';
import { formatDate } from '../utils/helpers';
import { SearchIcon, PlusIcon, TrashIcon, EditIcon } from '../components/icons';
import { openModal, openContextMenu } from '../store/slices/uiSlice';
import * as Tabs from '@radix-ui/react-tabs';

const Albums: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentProfile } = useSelector((state: RootState) => state.profiles);
  const { albums, isLoading, error } = useSelector((state: RootState) => state.albums);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeTab, setActiveTab] = useState('all');
  
  useEffect(() => {
    if (currentProfile) {
      dispatch(fetchAlbums({ 
        profileId: currentProfile.id,
        sortBy,
        sortOrder: sortOrder as 'asc' | 'desc',
      }));
    }
  }, [currentProfile, sortBy, sortOrder, dispatch]);
  
  const handleAlbumClick = (album: Album) => {
    navigate(`/albums/${album.id}`);
  };
  
  const handleCreateAlbum = () => {
    if (!currentProfile) return;
    
    dispatch(openModal({
      modalId: 'createAlbum',
      data: { profileId: currentProfile.id }
    }));
  };
  
  const handleDeleteAlbum = async (album: Album, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentProfile) return;
    
    if (confirm('Are you sure you want to delete this album?')) {
      await dispatch(deleteAlbum({
        profileId: currentProfile.id,
        albumId: album.id
      }));
    }
  };
  
  const handleEditAlbum = (album: Album, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentProfile) return;
    
    dispatch(openModal({
      modalId: 'editAlbum',
      data: { 
        profileId: currentProfile.id,
        album
      }
    }));
  };
  
  const handleAlbumContextMenu = (e: React.MouseEvent, album: Album) => {
    e.preventDefault();
    
    dispatch(openContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          id: 'open-album',
          label: 'Open Album',
          action: 'open-album'
        },
        {
          id: 'edit-album',
          label: 'Edit Album',
          action: 'edit-album'
        },
        {
          id: 'delete-album',
          label: 'Delete Album',
          action: 'delete-album'
        }
      ],
      context: { album }
    }));
  };
  
  const getFilteredAlbums = () => {
    // First filter by album type if selected
    let filtered = [...albums];
    
    if (activeTab === 'manual') {
      filtered = filtered.filter(album => album.type === AlbumType.MANUAL);
    } else if (activeTab === 'auto') {
      filtered = filtered.filter(album => album.type === AlbumType.AUTO);
    } else if (activeTab === 'recommended') {
      filtered = filtered.filter(album => album.type === AlbumType.RECOMMENDED);
    }
    
    // Then filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(album => {
        const name = album.name.toLowerCase();
        const desc = album.description?.toLowerCase() || '';
        return name.includes(searchLower) || desc.includes(searchLower);
      });
    }
    
    return filtered;
  };
  
  if (!currentProfile) {
    return (
      <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-md">
        <p className="text-center text-lg text-gray-600 dark:text-gray-300">
          Please select a profile to view your albums
        </p>
      </div>
    );
  }
  
  const filteredAlbums = getFilteredAlbums();
  
  return (
    <div>
      <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-md mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
          <h1 className="text-2xl font-medium text-gray-800 dark:text-gray-200">Your Albums</h1>
          
          <div className="flex gap-4 items-center">
            {/* Search input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search albums..."
                className="pl-9 pr-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <SearchIcon size={14} />
              </div>
            </div>
            
            {/* Sort options */}
            <div className="flex gap-2">
              <select 
                className="bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="updated_at">Last Updated</option>
                <option value="created_at">Date Created</option>
                <option value="name">Name</option>
              </select>
              
              <select 
                className="bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
            
            {/* Create album button */}
            <button
              onClick={handleCreateAlbum}
              className="flex items-center gap-1 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
            >
              <PlusIcon size={16} />
              <span>Create Album</span>
            </button>
          </div>
        </div>
        
        {/* Album type tabs */}
        <Tabs.Root 
          defaultValue="all" 
          value={activeTab} 
          onValueChange={setActiveTab}
        >
          <Tabs.List className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
            <Tabs.Trigger 
              value="all" 
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'all' 
                  ? 'border-primary text-primary dark:text-primary-light' 
                  : 'border-transparent text-gray-500 dark:text-gray-400'
              }`}
            >
              All Albums
            </Tabs.Trigger>
            <Tabs.Trigger 
              value="manual" 
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'manual' 
                  ? 'border-primary text-primary dark:text-primary-light' 
                  : 'border-transparent text-gray-500 dark:text-gray-400'
              }`}
            >
              Manual
            </Tabs.Trigger>
            <Tabs.Trigger 
              value="auto" 
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'auto' 
                  ? 'border-primary text-primary dark:text-primary-light' 
                  : 'border-transparent text-gray-500 dark:text-gray-400'
              }`}
            >
              Auto-generated
            </Tabs.Trigger>
            <Tabs.Trigger 
              value="recommended" 
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'recommended' 
                  ? 'border-primary text-primary dark:text-primary-light' 
                  : 'border-transparent text-gray-500 dark:text-gray-400'
              }`}
            >
              Recommended
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      </div>
      
      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-300">Loading albums...</span>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-md">
          <div className="text-center text-red-500 dark:text-red-400">
            <p className="text-lg font-medium mb-2">Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {!isLoading && !error && filteredAlbums.length === 0 && (
        <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-md">
          <div className="text-center">
            <h2 className="text-xl font-medium mb-4 text-gray-800 dark:text-gray-200">No albums found</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {searchTerm ? 'No albums match your search criteria.' : 'Create your first album to start organizing your images.'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreateAlbum}
                className="inline-flex items-center gap-1 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
              >
                <PlusIcon size={16} />
                <span>Create Album</span>
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Albums grid */}
      {!isLoading && !error && filteredAlbums.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredAlbums.map(album => (
            <div
              key={album.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 transition-shadow hover:shadow-lg cursor-pointer"
              onClick={() => handleAlbumClick(album)}
              onContextMenu={(e) => handleAlbumContextMenu(e, album)}
            >
              {/* Album cover */}
              <div className="aspect-square bg-gray-200 dark:bg-gray-900 overflow-hidden relative">
                {album.cover_image_id ? (
                  <div className="w-full h-full bg-gray-300 dark:bg-gray-700">
                    {/* We'd need to fetch the actual cover image here */}
                    <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                      Album Cover
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                    No Cover
                  </div>
                )}
                
                {/* Album type badge */}
                <div className="absolute top-2 left-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    album.type === AlbumType.AUTO 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : album.type === AlbumType.RECOMMENDED
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {album.type === AlbumType.AUTO 
                      ? 'Auto' 
                      : album.type === AlbumType.RECOMMENDED 
                        ? 'Recommended' 
                        : 'Manual'
                    }
                  </span>
                </div>
                
                {/* Action buttons */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={(e) => handleEditAlbum(album, e)}
                    title="Edit album"
                  >
                    <EditIcon size={16} />
                  </button>
                  <button
                    className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:bg-red-100 dark:hover:bg-red-900"
                    onClick={(e) => handleDeleteAlbum(album, e)}
                    title="Delete album"
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              </div>
              
              {/* Album info */}
              <div className="p-4">
                <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1 truncate">
                  {album.name}
                </h3>
                {album.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                    {album.description}
                  </p>
                )}
                <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
                  <span>{formatDate(album.updated_at, 'MMM d, yyyy')}</span>
                  <span>{album.images.length} {album.images.length === 1 ? 'image' : 'images'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Albums;
