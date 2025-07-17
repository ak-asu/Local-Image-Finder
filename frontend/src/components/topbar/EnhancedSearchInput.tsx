
import React, { useState, useRef } from 'react';
import { Search, X, Image, ArrowRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { setCurrentQuery, setQueryImage } from '@/redux/slices/chatSlice';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SearchInputProps {
  onSubmit: () => void;
}

const EnhancedSearchInput: React.FC<SearchInputProps> = ({ onSubmit }) => {
  const dispatch = useAppDispatch();
  const currentQuery = useAppSelector((state) => state.chat.currentQuery);
  const queryImage = useAppSelector((state) => state.chat.queryImage);
  
  const [selectedModel, setSelectedModel] = useState("default");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setCurrentQuery(e.target.value));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentQuery.trim() || queryImage) {
      onSubmit();
    }
  };
  
  const handleClearQuery = () => {
    dispatch(setCurrentQuery(''));
    dispatch(setQueryImage(null));
  };
  
  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          dispatch(setQueryImage(event.target.result as string));
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleClickImageButton = () => {
    fileInputRef.current?.click();
  };
  
  const handleRemoveImage = () => {
    dispatch(setQueryImage(null));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 max-w-xl items-center gap-2">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-muted-foreground" />
        </div>
        
        <input
          type="text"
          value={currentQuery}
          onChange={handleQueryChange}
          placeholder="Search for images..."
          className="w-full py-2 pl-10 pr-10 border border-input rounded-md bg-background"
        />
        
        {(currentQuery || queryImage) && (
          <button
            type="button"
            onClick={handleClearQuery}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X size={16} className="text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>
      
      {/* Image upload button */}
      <button
        type="button"
        onClick={handleClickImageButton}
        className={`flex items-center justify-center p-2 rounded-md ${
          queryImage ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'
        }`}
      >
        <Image size={16} />
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageInputChange}
        accept="image/*"
        className="hidden"
      />
      
      {/* Model selector */}
      <Select value={selectedModel} onValueChange={setSelectedModel}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Model" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Default</SelectItem>
          <SelectItem value="fast">Fast</SelectItem>
          <SelectItem value="accurate">Accurate</SelectItem>
        </SelectContent>
      </Select>
      
      {/* Submit button */}
      <button
        type="submit"
        disabled={!currentQuery && !queryImage}
        className={`flex items-center justify-center p-2 rounded-md ${
          currentQuery || queryImage
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-muted text-muted-foreground cursor-not-allowed'
        }`}
      >
        <ArrowRight size={16} />
      </button>
      
      {/* Image preview */}
      {queryImage && (
        <div className="absolute top-12 left-0 right-0 bg-popover border border-border rounded-md p-2 shadow-md z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Query image:</span>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="p-1 rounded-full hover:bg-muted"
            >
              <X size={12} />
            </button>
          </div>
          <div className="w-full h-20 relative">
            <img
              src={queryImage}
              alt="Query"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </form>
  );
};

export default EnhancedSearchInput;
