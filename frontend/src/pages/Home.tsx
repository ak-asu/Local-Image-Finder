import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { ImageSearchResult } from '../types';
import { 
  ShareIcon, 
  ExportIcon, 
  SaveIcon
} from '../components/icons';
import { openImageInSystemViewer, similarityToPercentage } from '../utils/helpers';
import { openContextMenu } from '../store/slices/uiSlice';
import { openModal } from '../store/slices/uiSlice';

const Home: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { results, isSearching, error } = useSelector((state: RootState) => state.search);
  const { currentSession } = useSelector((state: RootState) => state.session);
  const { currentProfile } = useSelector((state: RootState) => state.profiles);

  // Group results into closest matches and related
  const closestMatches = results.slice(0, 5);
  const relatedImages = results.slice(5);

  const handleImageClick = (imagePath: string) => {
    openImageInSystemViewer(imagePath);
  };

  const handleImageContextMenu = (e: React.MouseEvent, image: ImageSearchResult) => {
    e.preventDefault();
    
    dispatch(openContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { 
          id: 'open', 
          label: 'Open Image', 
          action: 'open-image',
        },
        { 
          id: 'properties', 
          label: 'Properties', 
          action: 'show-properties',
        },
        { 
          id: 'copy-path', 
          label: 'Copy File Path', 
          action: 'copy-path',
        },
        { 
          id: 'add-to-album', 
          label: 'Add to Album', 
          action: 'add-to-album',
        }
      ],
      context: {
        image: image
      }
    }));
  };

  // const handleShowImageProperties = (image: ImageSearchResult) => {
  //   dispatch(openModal({
  //     modalId: 'imageProperties',
  //     data: { image }
  //   }));
  // };

  const handleCreateAlbum = () => {
    if (!currentProfile) return;
    
    dispatch(openModal({
      modalId: 'createAlbum',
      data: { 
        profileId: currentProfile.id,
        resultIds: results.map(r => r.image.id)
      }
    }));
  };

  if (!currentProfile) {
    return (
      <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-md">
        <p className="text-center text-lg text-gray-600 dark:text-gray-300">
          Please select a profile to start
        </p>
      </div>
    );
  }

  if (isSearching) {
    return (
      <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-md">
        <div className="flex justify-center items-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
          <span className="text-gray-600 dark:text-gray-300">Searching...</span>
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

  if (results.length === 0) {
    return (
      <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-md">
        <div className="text-center">
          <h2 className="text-2xl font-medium mb-4 text-gray-800 dark:text-gray-200">Welcome to Local Image Finder</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Search for images by entering text or uploading an image using the search bar above.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Current query section */}
      <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium text-gray-800 dark:text-gray-200">
            {currentSession?.queries[0]?.text || "Current Search"}
          </h2>
          <div className="flex space-x-2">
            <button 
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Share results"
            >
              <ShareIcon size={18} />
            </button>
            <button 
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Export results"
            >
              <ExportIcon size={18} />
            </button>
            <button 
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Save to album"
              onClick={handleCreateAlbum}
            >
              <SaveIcon size={18} />
            </button>
          </div>
        </div>
        
        {/* Closest matches */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
            Closest Matches
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {closestMatches.map((result) => (
              <div 
                key={result.image.id}
                className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md"
              >
                {!result.exists && (
                  <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center text-white z-10">
                    <span>Image not found</span>
                  </div>
                )}
                <div 
                  className="aspect-square bg-gray-100 dark:bg-gray-800"
                  onClick={() => result.exists && handleImageClick(result.image.metadata.filepath)}
                  onContextMenu={(e) => handleImageContextMenu(e, result)}
                >
                  {result.exists ? (
                    <img 
                      src={`file://${encodeURI(result.image.metadata.filepath)}`}
                      alt={result.image.metadata.filename}
                      className="w-full h-full object-cover cursor-pointer"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Image not available
                    </div>
                  )}
                </div>
                <div className="p-2 text-xs bg-white dark:bg-gray-800">
                  <div className="truncate text-gray-700 dark:text-gray-300">
                    {result.image.metadata.filename}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      {similarityToPercentage(result.similarity_score)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {result.image.metadata.width && result.image.metadata.height ? 
                        `${result.image.metadata.width}×${result.image.metadata.height}` : 
                        'Unknown size'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Related images */}
        {relatedImages.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
              Related Images
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {relatedImages.map((result) => (
                <div 
                  key={result.image.id}
                  className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md"
                >
                  {!result.exists && (
                    <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center text-white z-10 text-xs">
                      <span>Image not found</span>
                    </div>
                  )}
                  <div 
                    className="aspect-square bg-gray-100 dark:bg-gray-800"
                    onClick={() => result.exists && handleImageClick(result.image.metadata.filepath)}
                    onContextMenu={(e) => handleImageContextMenu(e, result)}
                  >
                    {result.exists ? (
                      <img 
                        src={`file://${encodeURI(result.image.metadata.filepath)}`}
                        alt={result.image.metadata.filename}
                        className="w-full h-full object-cover cursor-pointer"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        N/A
                      </div>
                    )}
                  </div>
                  <div className="p-1 text-xs bg-white dark:bg-gray-800">
                    <div className="truncate text-gray-700 dark:text-gray-300">
                      {result.image.metadata.filename}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">
                        {similarityToPercentage(result.similarity_score)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
