
import React, { useState, useRef } from 'react';
import { Search, Paperclip, ChevronDown, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { setCurrentQuery, setQueryImage } from '@/redux/slices/chatSlice';

interface SearchInputProps {
  onSubmit: () => void;
}

const SearchInput: React.FC<SearchInputProps> = ({ onSubmit }) => {
  const dispatch = useAppDispatch();
  const query = useAppSelector((state) => state.chat.currentQuery);
  const queryImage = useAppSelector((state) => state.chat.queryImage);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const models = useAppSelector((state) => state.settings.availableModels);
  const activeProfile = useAppSelector((state) => state.user.activeProfileId);
  const selectedModel = useAppSelector((state) => 
    state.settings.profileSettings[activeProfile || 'default']?.selectedModel
  );

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setCurrentQuery(e.target.value));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        dispatch(setQueryImage(result));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    dispatch(setQueryImage(null));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() || queryImage) {
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="relative flex items-center">
        <div className="relative flex-grow">
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search images..."
            className="w-full py-2 pl-10 pr-4 rounded-md bg-secondary text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        </div>

        {/* File input button */}
        <div className="ml-2 relative">
          <motion.button
            type="button"
            className="p-2 rounded-md bg-secondary text-foreground hover:bg-secondary/80"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip size={18} />
          </motion.button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Model selector dropdown */}
        <div className="ml-2 relative">
          <motion.button
            type="button"
            className="flex items-center space-x-1 p-2 rounded-md bg-secondary text-foreground hover:bg-secondary/80"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
          >
            <span className="text-sm">{selectedModel || 'Model'}</span>
            <ChevronDown size={16} className={isModelDropdownOpen ? 'transform rotate-180' : ''} />
          </motion.button>

          {isModelDropdownOpen && (
            <motion.div
              className="absolute right-0 mt-1 w-40 bg-popover rounded-md shadow-lg z-10 border border-border"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {models.map((model) => (
                <div
                  key={model}
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-secondary"
                  onClick={() => {
                    // Update selected model here
                    setIsModelDropdownOpen(false);
                  }}
                >
                  {model}
                </div>
              ))}
            </motion.div>
          )}
        </div>

        <motion.button
          type="submit"
          className="ml-2 p-2 rounded-md bg-primary text-primary-foreground hover:opacity-90"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Search size={18} />
        </motion.button>
      </div>
      
      {/* Image preview */}
      {queryImage && (
        <div className="mt-2 relative inline-block">
          <img
            src={queryImage}
            alt="Query"
            className="h-16 rounded-md object-cover"
          />
          <button
            type="button"
            className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5"
            onClick={handleClearImage}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </form>
  );
};

export default SearchInput;
