import React, { useState, useRef, useEffect } from 'react';
import { Search, Paperclip, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const inputRef = useRef<HTMLInputElement>(null);
  
  const models = useAppSelector((state) => state.settings.availableModels);
  const activeProfile = useAppSelector((state) => state.user.activeProfileId);
  const selectedModel = useAppSelector((state) => 
    state.settings.profileSettings[activeProfile || 'default']?.selectedModel
  );

  // Focus input on first render
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Register keyboard shortcuts
  // useKeyboardShortcuts();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isModelDropdownOpen) {
        setIsModelDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModelDropdownOpen]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setCurrentQuery(e.target.value));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please select an image file",
        });
        return;
      }

      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Image size should be less than 10MB",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        dispatch(setQueryImage(result));
        toast({
          title: "Image added",
          description: "Image attached to search query",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click handlers
    dispatch(setQueryImage(null));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: "Image removed",
      description: "Image removed from search query",
    });
  };

  const handleModelSelect = (model: string) => {
    // Here we would dispatch an action to update the selected model
    setIsModelDropdownOpen(false);
    toast({
      title: "Model selected",
      description: `Search model set to ${model}`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() || queryImage) {
      onSubmit();
    } else {
      toast({
        variant: "destructive",
        title: "Empty search",
        description: "Please enter a query or attach an image",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="relative flex items-center">
        <div className="relative flex-grow">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search images... (Ctrl+F)"
            className="w-full py-2 pl-10 pr-4 rounded-md bg-secondary text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Search images"
          />
          <Search 
            size={18} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
          />
        </div>

        {/* File input button */}
        <div className="ml-2 relative">
          <motion.button
            type="button"
            className="p-2 rounded-md bg-secondary text-foreground hover:bg-secondary/80"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach image"
            title="Attach an image"
          >
            <Paperclip size={18} />
          </motion.button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            aria-hidden="true"
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
            aria-label="Select model"
            aria-expanded={isModelDropdownOpen}
            aria-controls="model-dropdown"
          >
            <span className="text-sm">{selectedModel || 'Model'}</span>
            <ChevronDown 
              size={16} 
              className={`transition-transform ${isModelDropdownOpen ? 'transform rotate-180' : ''}`} 
            />
          </motion.button>

          <AnimatePresence>
            {isModelDropdownOpen && (
              <motion.div
                id="model-dropdown"
                className="absolute right-0 mt-1 w-40 bg-popover rounded-md shadow-lg z-10 border border-border overflow-hidden"
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {models.map((model) => (
                  <div
                    key={model}
                    className="px-4 py-2 text-sm cursor-pointer hover:bg-secondary transition-colors"
                    onClick={() => handleModelSelect(model)}
                    role="menuitem"
                  >
                    {model}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          type="submit"
          className="ml-2 p-2 rounded-md bg-primary text-primary-foreground hover:opacity-90"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Search"
        >
          <Search size={18} />
        </motion.button>
      </div>
      
      {/* Image preview */}
      <AnimatePresence>
        {queryImage && (
          <motion.div 
            className="mt-2 relative inline-block"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <img
              src={queryImage}
              alt="Query"
              className="h-16 rounded-md object-cover"
            />
            <motion.button
              type="button"
              className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5"
              onClick={handleClearImage}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Remove image"
            >
              <X size={14} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
};

export default SearchInput;
