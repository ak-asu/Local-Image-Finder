import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { RootState, AppDispatch } from '../store';
import { 
  getAlbum, 
  updateAlbum, 
  deleteAlbum,
  removeImageFromAlbum
} from '../store/slices/albumsSlice';
import { openContextMenu } from '../store/slices/uiSlice';
import { searchByText } from '../store/slices/searchSlice';
import { AlbumType, Image } from '../types';
import { 
  ArrowLeftIcon, 
  EditIcon, 
  SaveIcon, 
  TrashIcon, 
  SearchIcon,
  ExportIcon,
  GridIcon,
  ListIcon,
  CheckIcon,
  XIcon 
} from '../components/icons';
import { formatDate } from '../utils/helpers';

const AlbumView: React.FC = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const { currentProfile } = useSelector((state: RootState) => state.profiles);
  const { currentAlbum, isLoading } = useSelector((state: RootState) => state.albums);
  const { images } = useSelector((state: RootState) => state.images);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
  });
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'details'>('grid');
  const [searchText, setSearchText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (albumId && currentProfile) {
      dispatch(getAlbum({ profileId: currentProfile.id, albumId }));
    }
  }, [albumId, currentProfile, dispatch]);

  useEffect(() => {
    if (currentAlbum) {
      setEditForm({
        name: currentAlbum.name,
        description: currentAlbum.description || '',
      });
    }
  }, [currentAlbum]);

  // Get the full image objects for the album images
  const albumImages = currentAlbum?.images.map(albumImage => {
    const image = images.find(img => img.id === albumImage.image_id);
    return image ? {
      id: albumImage.image_id,
      filename: image.metadata.filename,
      filepath: image.metadata.filepath,
      filesize: image.metadata.filesize,
      exists: image.metadata.exists !== false, // Default to true if not specified
      order: albumImage.order,
      added_at: albumImage.added_at
    } : null;
  }).filter(Boolean) || [];
  
  const filteredImages = albumImages.filter(image => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    const filename = image.filename.toLowerCase();
    return filename.includes(searchLower);
  });

  // Sort images by their order in the album
  const sortedImages = [...filteredImages].sort((a, b) => a.order - b.order);

  const handleGoBack = () => {
    navigate('/albums');
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!currentAlbum || !currentProfile) return;
    
    dispatch(updateAlbum({
      profileId: currentProfile.id,
      albumId: currentAlbum.id,
      data: {
        name: editForm.name,
        description: editForm.description,
      }
    }));
    
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (currentAlbum) {
      setEditForm({
        name: currentAlbum.name,
        description: currentAlbum.description || '',
      });
    }
    setIsEditing(false);
  };

  const handleDeleteAlbum = () => {
    if (!currentAlbum || !currentProfile) return;
    
    setConfirmDelete(true);
  };

  const confirmDeleteAlbum = () => {
    if (!currentAlbum || !currentProfile) return;
    
    dispatch(deleteAlbum({
      profileId: currentProfile.id,
      albumId: currentAlbum.id
    })).then(() => {
      navigate('/albums');
    });

    setConfirmDelete(false);
  };

  const handleImageClick = (imagePath: string) => {
    // Open the image in the default system viewer
    if (window.electron?.openFile) {
      window.electron.openFile(imagePath);
    } else {
      console.warn('Electron openFile API not available');
    }
  };

  const handleImageSelect = (imageId: string, e: React.MouseEvent) => {
    // If shift key is pressed, toggle selection without affecting others
    if (!e.shiftKey) {
      setSelectedImages(prev => {
        if (prev.includes(imageId)) {
          return prev.filter(id => id !== imageId);
        } else {
          return [...prev, imageId];
        }
      });
    } else {
      // Clear selection when clicking on background
      setSelectedImages([]);
    }
  };

  const handleSelectAll = () => {
    if (!filteredImages.length) return;
    
    const allImageIds = filteredImages.map(image => image.id);
    
    // If all are already selected, clear selection
    if (allImageIds.length === selectedImages.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(allImageIds);
    }
  };

  const handleImageContextMenu = (e: React.MouseEvent, imageId: string, imagePath: string) => {
    e.preventDefault();
    
    // If image is not selected, select it first
    if (!selectedImages.includes(imageId)) {
      setSelectedImages([imageId]);
    }
    
    dispatch(openContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          id: 'open-image',
          label: 'Open Image',
          action: 'open-image'
        },
        {
          id: 'view-properties',
          label: 'Properties',
          action: 'view-properties'
        },
        {
          id: 'remove-from-album',
          label: `Remove ${selectedImages.length > 1 ? `${selectedImages.length} images` : 'image'} from album`,
          action: 'remove-from-album'
        }
      ],
      context: { imageIds: selectedImages, albumId: currentAlbum?.id }
    }));
  };

  const handleRemoveSelectedImages = () => {
    if (!currentAlbum || !currentProfile || selectedImages.length === 0) return;
    
    if (confirm(`Are you sure you want to remove ${selectedImages.length} image(s) from this album?`)) {
      Promise.all(
        selectedImages.map(imageId => 
          dispatch(removeImageFromAlbum({
            profileId: currentProfile.id,
            albumId: currentAlbum.id,
            imageId
          }))
        )
      ).then(() => {
        setSelectedImages([]);
      });
    }
  };

  const handleSearchWithAlbumPrompt = () => {
    if (!currentAlbum || !currentProfile) return;
    
    dispatch(searchByText({
      profileId: currentProfile.id,
      query: currentAlbum.search_query || currentAlbum.name,
    }));
    
    navigate('/');
  };

  const handleExportAlbum = () => {
    if (!currentAlbum) return;
    
    const exportData = {
      ...currentAlbum,
      exported_date: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFilename = `${currentAlbum.name.replace(/\s+/g, '_')}_album_export.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFilename);
    linkElement.click();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!currentAlbum || !currentProfile) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <p className="text-center text-gray-600 dark:text-gray-300">Album not found</p>
        <button
          onClick={handleGoBack}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md mx-auto block"
        >
          Back to Albums
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Back button and header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handleGoBack}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Go back"
          >
            <ArrowLeftIcon size={20} />
          </button>
          
          {isEditing ? (
            <div className="flex-1 flex flex-col md:flex-row gap-2">
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Album name"
                className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
                autoFocus
              />
            </div>
          ) : (
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {currentAlbum.name}
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                ({filteredImages.length} images)
              </span>
            </h1>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-4 py-2 bg-primary text-white rounded-md"
              >
                <SaveIcon size={16} />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              >
                <XIcon size={16} />
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleSelectAll()}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md"
                title={selectedImages.length === filteredImages.length && selectedImages.length > 0 
                  ? "Deselect all" 
                  : "Select all"
                }
              >
                {selectedImages.length === filteredImages.length && selectedImages.length > 0 
                  ? "Deselect all" 
                  : "Select all"
                }
              </button>
              
              <div className="flex border border-gray-300 dark:border-gray-600 rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                  title="Grid view"
                >
                  <GridIcon size={16} />
                </button>
                <button
                  onClick={() => setViewMode('details')}
                  className={`p-2 ${viewMode === 'details' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                  title="Details view"
                >
                  <ListIcon size={16} />
                </button>
              </div>
              
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    className="px-3 py-1 text-sm flex items-center gap-1 border border-gray-300 dark:border-gray-600 rounded-md"
                    aria-label="Actions"
                  >
                    Actions
                    <span className="border-l border-gray-300 dark:border-gray-600 h-4 mx-1"></span>
                    <span>▼</span>
                  </button>
                </DropdownMenu.Trigger>
                
                <DropdownMenu.Portal>
                  <DropdownMenu.Content 
                    className="min-w-[180px] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 z-50"
                    sideOffset={5}
                  >
                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-2 py-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={handleEdit}
                    >
                      <EditIcon size={16} />
                      <span>Edit Album</span>
                    </DropdownMenu.Item>
                    
                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-2 py-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={handleSearchWithAlbumPrompt}
                    >
                      <SearchIcon size={16} />
                      <span>Search with this prompt</span>
                    </DropdownMenu.Item>
                    
                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-2 py-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={handleExportAlbum}
                    >
                      <ExportIcon size={16} />
                      <span>Export Album</span>
                    </DropdownMenu.Item>
                    
                    <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                    
                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-2 py-2 rounded cursor-pointer hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400"
                      onClick={handleDeleteAlbum}
                    >
                      <TrashIcon size={16} />
                      <span>Delete Album</span>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
              
              {selectedImages.length > 0 && (
                <button
                  onClick={handleRemoveSelectedImages}
                  className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30"
                  title="Remove selected images"
                >
                  <TrashIcon size={16} />
                  <span>Remove ({selectedImages.length})</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Album details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            {isEditing ? (
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Album description"
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
                rows={3}
              />
            ) : (
              <>
                {currentAlbum.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    {currentAlbum.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>
                    Created: {formatDate(currentAlbum.created_at)}
                  </span>
                  <span>
                    Last updated: {formatDate(currentAlbum.updated_at)}
                  </span>
                  <span>
                    Type: {currentAlbum.type === AlbumType.MANUAL ? 'Manual' : 
                          currentAlbum.type === AlbumType.AUTO ? 'Automatic' : 
                          'Recommended'}
                  </span>
                </div>
              </>
            )}
          </div>
          
          <div className="relative flex-shrink-0 w-full md:w-64">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search in album"
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
            />
            <SearchIcon 
              size={16} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            {searchText && (
              <button
                onClick={() => setSearchText('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XIcon size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Images grid/list */}
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4`}>
        {filteredImages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {searchText ? 'No images match your search.' : 'This album is empty.'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {sortedImages.map(image => (
              <div
                key={image.id}
                onClick={(e) => handleImageSelect(image.id, e)}
                onContextMenu={(e) => handleImageContextMenu(e, image.id, image.filepath)}
                className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden group ${
                  selectedImages.includes(image.id)
                    ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-800'
                    : ''
                }`}
              >
                {!image.exists ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <p className="text-sm text-red-500">File not found</p>
                    <p className="text-xs text-gray-500 truncate max-w-full px-2">{image.filename}</p>
                  </div>
                ) : (
                  <>
                    <img
                      src={`file://${image.filepath}`}
                      alt={image.filename}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onDoubleClick={() => handleImageClick(image.filepath)}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity" />
                    
                    {/* Selection indicator */}
                    {selectedImages.includes(image.id) && (
                      <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                        <CheckIcon size={14} />
                      </div>
                    )}
                    
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="truncate">{image.filename}</p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">Image</th>
                  <th className="px-4 py-2 text-left">Filename</th>
                  <th className="px-4 py-2 text-left">File path</th>
                  <th className="px-4 py-2 text-left">Size</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedImages.map(image => (
                  <tr
                    key={image.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-750 ${
                      selectedImages.includes(image.id)
                        ? 'bg-primary/5 dark:bg-primary/10'
                        : ''
                    }`}
                    onClick={(e) => handleImageSelect(image.id, e)}
                  >
                    <td className="px-4 py-2">
                      <div className="w-16 h-16 relative">
                        {!image.exists ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                            <span className="text-xs text-red-500">Not found</span>
                          </div>
                        ) : (
                          <img
                            src={`file://${image.filepath}`}
                            alt={image.filename}
                            className="w-full h-full object-cover rounded"
                            loading="lazy"
                            onDoubleClick={() => handleImageClick(image.filepath)}
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 max-w-[200px]">
                      <p className="truncate">{image.filename}</p>
                    </td>
                    <td className="px-4 py-2 max-w-[300px]">
                      <p className="truncate">{image.filepath}</p>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {Math.round(image.filesize / 1024)} KB
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleImageClick(image.filepath)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                          title="Open image"
                        >
                          <SearchIcon size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (currentProfile) {
                              dispatch(removeImageFromAlbum({
                                profileId: currentProfile.id,
                                albumId: currentAlbum.id,
                                imageId: image.id
                              }));
                            }
                          }}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full text-red-500"
                          title="Remove from album"
                        >
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Confirm delete dialog */}
      <Dialog.Root open={confirmDelete} onOpenChange={setConfirmDelete}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <Dialog.Title className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Delete Album
            </Dialog.Title>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this album? This cannot be undone.
            </p>
            
            <div className="flex justify-end gap-3">
              <Dialog.Close asChild>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md">
                  Cancel
                </button>
              </Dialog.Close>
              
              <button
                onClick={confirmDeleteAlbum}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete Album
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default AlbumView;
