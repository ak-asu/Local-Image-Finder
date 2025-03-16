import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchSessions, deleteSession, getSession } from '../store/slices/sessionSlice';
import { Session } from '../types';
import { formatDate, truncateString } from '../utils/helpers';
import { SearchIcon, TrashIcon, SaveIcon, ExportIcon } from '../components/icons';
import { exportSessionToJson } from '../utils/helpers';
import { openModal, openContextMenu } from '../store/slices/uiSlice';

const Library: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentProfile } = useSelector((state: RootState) => state.profiles);
  const { sessions, isLoading, error } = useSelector((state: RootState) => state.session);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  useEffect(() => {
    if (currentProfile) {
      dispatch(fetchSessions(currentProfile.id));
    }
  }, [currentProfile, dispatch]);
  
  const handleSessionClick = async (session: Session) => {
    if (!currentProfile) return;
    
    await dispatch(getSession({ 
      profileId: currentProfile.id, 
      sessionId: session.id 
    }));
    
    navigate('/');
  };
  
  const handleExportSession = (session: Session) => {
    exportSessionToJson(session);
  };
  
  const handleDeleteSession = async (session: Session) => {
    if (!currentProfile) return;
    
    if (confirm('Are you sure you want to delete this session?')) {
      await dispatch(deleteSession({
        profileId: currentProfile.id,
        sessionId: session.id
      }));
    }
  };
  
  const handleSaveAsAlbum = (session: Session) => {
    if (!currentProfile) return;
    
    dispatch(openModal({
      modalId: 'createAlbumFromSession',
      data: { 
        profileId: currentProfile.id,
        sessionId: session.id,
        sessionName: session.name || 'Untitled Session'
      }
    }));
  };
  
  const handleSessionContextMenu = (e: React.MouseEvent, session: Session) => {
    e.preventDefault();
    
    dispatch(openContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          id: 'open-session',
          label: 'Open Session',
          action: 'open-session'
        },
        {
          id: 'save-as-album',
          label: 'Save as Album',
          action: 'save-as-album'
        },
        {
          id: 'export-session',
          label: 'Export JSON',
          action: 'export-session'
        },
        {
          id: 'rename-session',
          label: 'Rename',
          action: 'rename-session'
        },
        {
          id: 'delete-session',
          label: 'Delete Session',
          action: 'delete-session'
        }
      ],
      context: { session }
    }));
  };
  
  const filteredSessions = sessions.filter(session => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const name = session.name?.toLowerCase() || '';
    
    // Check if any query text matches
    const queryMatches = session.queries.some(q => 
      q.text?.toLowerCase().includes(searchLower)
    );
    
    return name.includes(searchLower) || queryMatches;
  });
  
  if (!currentProfile) {
    return (
      <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-md">
        <p className="text-center text-lg text-gray-600 dark:text-gray-300">
          Please select a profile to view your library
        </p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-md">
        <div className="flex justify-center items-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
          <span className="text-gray-600 dark:text-gray-300">Loading your sessions...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-md">
        <div className="text-center text-red-500 dark:text-red-400">
          <p className="text-lg font-medium mb-2">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  if (sessions.length === 0) {
    return (
      <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-md">
        <div className="text-center">
          <h2 className="text-2xl font-medium mb-4 text-gray-800 dark:text-gray-200">Your Library</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Your search sessions will appear here. Start by searching for images!
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-md mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
          <h1 className="text-2xl font-medium text-gray-800 dark:text-gray-200">Your Library</h1>
          
          <div className="flex gap-4 items-center">
            {/* Search input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search sessions..."
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
          </div>
        </div>
      </div>
      
      {/* Sessions grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSessions.map(session => (
          <div
            key={session.id}
            className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 transition-shadow hover:shadow-lg"
            onClick={() => handleSessionClick(session)}
            onContextMenu={(e) => handleSessionContextMenu(e, session)}
          >
            {/* Session preview */}
            <div className="aspect-video bg-gray-200 dark:bg-gray-900 overflow-hidden relative">
              {session.queries[0]?.image_paths && session.queries[0].image_paths.length > 0 ? (
                <div className="w-full h-full flex justify-center items-center text-gray-500 dark:text-gray-400">
                  Image search session
                </div>
              ) : (
                <div className="w-full h-full flex justify-center items-center text-gray-500 dark:text-gray-400 p-4">
                  <p className="text-xl font-medium line-clamp-3 text-center">
                    {session.queries[0]?.text || "Untitled Search"}
                  </p>
                </div>
              )}
              
              {/* Action buttons */}
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveAsAlbum(session);
                  }}
                  title="Save as album"
                >
                  <SaveIcon size={16} />
                </button>
                <button
                  className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportSession(session);
                  }}
                  title="Export session"
                >
                  <ExportIcon size={16} />
                </button>
                <button
                  className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:bg-red-100 dark:hover:bg-red-900"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(session);
                  }}
                  title="Delete session"
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            </div>
            
            {/* Session info */}
            <div className="p-4">
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1 truncate">
                {session.name || truncateString(session.queries[0]?.text || "Untitled Search", 30)}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(session.updated_at, 'PPP')}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {session.queries.length} {session.queries.length === 1 ? 'query' : 'queries'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Library;
