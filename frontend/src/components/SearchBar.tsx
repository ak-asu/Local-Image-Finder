import React, { useState, useRef, ChangeEvent } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { searchByText, searchByImage, searchCombined } from '../store/slices/searchSlice';
import { SearchIcon, PaperclipIcon, ChevronDownIcon, SendIcon } from './icons';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

const SearchBar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isSearching } = useSelector((state: RootState) => state.search);
  const { currentProfile } = useSelector((state: RootState) => state.profiles);
  
  const [searchText, setSearchText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setSelectedFiles([...selectedFiles, ...newFiles]);
    }
  };
  
  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const removeFile = (index: number) => {
    const updatedFiles = [...selectedFiles];
    updatedFiles.splice(index, 1);
    setSelectedFiles(updatedFiles);
  };
  
  const handleSearch = async () => {
    if (!currentProfile) return;
    
    if (searchText.trim() || selectedFiles.length > 0) {
      if (searchText.trim() && selectedFiles.length === 0) {
        // Text-only search
        dispatch(searchByText({
          query: searchText,
          profileId: currentProfile.id,
          saveToHistory: true
        }));
      } else if (!searchText.trim() && selectedFiles.length > 0) {
        // Image-only search
        dispatch(searchByImage({
          file: selectedFiles[0],
          profileId: currentProfile.id,
          saveToHistory: true
        }));
      } else {
        // Combined search
        dispatch(searchCombined({
          text: searchText,
          files: selectedFiles,
          profileId: currentProfile.id,
          saveToHistory: true
        }));
      }
      
      // Clear the form after search
      setSearchText('');
      setSelectedFiles([]);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };
  
  const modelOptions = [
    { value: 'default', label: 'Default Model' },
    { value: 'performance', label: 'Performance Mode' },
    { value: 'quality', label: 'Quality Mode' }
  ];

  return (
    <div className="search-bar flex-1">
      <div className="relative flex items-center">
        <div className="flex-1 flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
          <div className="pl-3 text-gray-500 dark:text-gray-400">
            <SearchIcon size={18} />
          </div>
          
          <input
            type="text"
            placeholder="Search by text or upload an image..."
            className="flex-1 py-3 px-2 bg-transparent border-none outline-none text-gray-800 dark:text-gray-200"
            value={searchText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isSearching}
          />
          
          {selectedFiles.length > 0 && (
            <div className="flex items-center gap-2 px-2">
              <div className="flex items-center gap-1">
                {selectedFiles.map((file, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-1 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-xs"
                  >
                    <span className="max-w-[100px] truncate">{file.name}</span>
                    <button 
                      className="text-gray-500 hover:text-red-500"
                      onClick={() => removeFile(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
            multiple
          />
          
          <button 
            onClick={handleFileSelect} 
            className="p-3 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary-light transition-colors"
            title="Attach images"
            disabled={isSearching}
          >
            <PaperclipIcon size={18} />
          </button>
          
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button 
                className="p-3 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary-light transition-colors border-l border-gray-200 dark:border-gray-600"
                disabled={isSearching}
              >
                <ChevronDownIcon size={18} />
              </button>
            </DropdownMenu.Trigger>
            
            <DropdownMenu.Portal>
              <DropdownMenu.Content 
                className="min-w-[200px] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 z-50"
                sideOffset={5}
                align="end"
              >
                <DropdownMenu.Label className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Search Options
                </DropdownMenu.Label>
                
                <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                
                <DropdownMenu.Label className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                  AI Model
                </DropdownMenu.Label>
                
                {modelOptions.map((option) => (
                  <DropdownMenu.Item
                    key={option.value}
                    className="flex items-center px-2 py-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <span>{option.label}</span>
                    {option.value === 'default' && (
                      <span className="ml-auto text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
                        Selected
                      </span>
                    )}
                  </DropdownMenu.Item>
                ))}
                
                <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                
                <DropdownMenu.Item
                  className="flex items-center px-2 py-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <span>Search Settings</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
        
        <button
          className="ml-2 bg-primary hover:bg-primary-dark text-white rounded-full p-2 transition-colors"
          onClick={handleSearch}
          disabled={isSearching || (!searchText.trim() && selectedFiles.length === 0)}
        >
          <SendIcon size={18} />
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
