
import React from 'react';
import { motion } from 'framer-motion';
import { Share, SaveAll, Download, ArrowRight } from 'lucide-react';

interface SearchResultProps {
  query: string;
  queryImage?: string;
  primaryImage?: {
    id: string;
    path: string;
  };
  relatedImages: Array<{
    id: string;
    path: string;
  }>;
}

const SearchResult: React.FC<SearchResultProps> = ({
  query,
  queryImage,
  primaryImage,
  relatedImages,
}) => {
  return (
    <motion.div
      className="mb-8 p-4 border border-border rounded-lg bg-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Query Section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {queryImage && (
            <img
              src={queryImage}
              alt="Query"
              className="w-10 h-10 rounded object-cover"
            />
          )}
          <div className="text-lg font-medium">{query}</div>
        </div>
        
        <div className="flex items-center space-x-2">
          <motion.button
            className="p-2 rounded-full hover:bg-secondary"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Share size={16} />
          </motion.button>
          <motion.button
            className="p-2 rounded-full hover:bg-secondary"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <SaveAll size={16} />
          </motion.button>
          <motion.button
            className="p-2 rounded-full hover:bg-secondary"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Download size={16} />
          </motion.button>
        </div>
      </div>

      {/* Primary Result */}
      {primaryImage && (
        <div className="mb-4">
          <div className="text-sm text-muted-foreground mb-2">Best match:</div>
          <img
            src={primaryImage.path}
            alt="Primary result"
            className="w-full max-h-80 object-contain rounded-md cursor-pointer hover:opacity-90 transition-opacity"
          />
        </div>
      )}

      {/* Related Results */}
      {relatedImages && relatedImages.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Related images:</div>
            <button className="text-sm text-primary flex items-center">
              View all <ArrowRight size={14} className="ml-1" />
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {relatedImages.map((image) => (
              <img
                key={image.id}
                src={image.path}
                alt="Related"
                className="h-24 w-full object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SearchResult;
