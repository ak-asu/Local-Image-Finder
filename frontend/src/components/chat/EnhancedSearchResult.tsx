
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share, SaveAll, Download, ArrowRight } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import imageService from '@/services/imageService';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { toast } from '@/hooks/use-toast';
import ImagePropertiesDialog from '@/components/common/ImagePropertiesDialog';
import { v4 as uuidv4 } from 'uuid';

interface EnhancedSearchResultProps {
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

const EnhancedSearchResult: React.FC<EnhancedSearchResultProps> = ({
  query,
  queryImage,
  primaryImage,
  relatedImages,
}) => {
  const [showingProperties, setShowingProperties] = useState<string | null>(null);
  const [imageProperties, setImageProperties] = useState<Record<string, any> | null>(null);

  const handleImageClick = async (imagePath: string) => {
    try {
      await imageService.openInSystemViewer(imagePath);
    } catch (error) {
      console.error('Failed to open image:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to open image in system viewer",
      });
    }
  };

  const handleShowProperties = async (imagePath: string) => {
    try {
      const properties = await imageService.getImageProperties(imagePath);
      setImageProperties(properties);
      setShowingProperties(imagePath);
    } catch (error) {
      console.error('Failed to get image properties:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load image properties",
      });
    }
  };

  const handleShare = () => {
    toast({
      title: "Shared",
      description: "Session shared successfully",
    });
  };

  const handleSave = () => {
    const sessionId = uuidv4();
    // Here you would implement the logic to save the session
    toast({
      title: "Saved",
      description: "Session saved to library",
    });
  };

  const handleDownload = () => {
    toast({
      title: "Downloaded",
      description: "Images downloaded successfully",
    });
  };

  const handleClosePropertiesDialog = () => {
    setShowingProperties(null);
    setImageProperties(null);
  };

  return (
    <motion.div
      className="mb-8 p-4 border border-border rounded-lg bg-card shadow-sm"
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
            onClick={handleShare}
            aria-label="Share"
          >
            <Share size={16} />
          </motion.button>
          <motion.button
            className="p-2 rounded-full hover:bg-secondary"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSave}
            aria-label="Save"
          >
            <SaveAll size={16} />
          </motion.button>
          <motion.button
            className="p-2 rounded-full hover:bg-secondary"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleDownload}
            aria-label="Download"
          >
            <Download size={16} />
          </motion.button>
        </div>
      </div>

      {/* Primary Result */}
      {primaryImage && (
        <div className="mb-4">
          <div className="text-sm text-muted-foreground mb-2">Best match:</div>
          <ContextMenu>
            <ContextMenuTrigger>
              <div className="cursor-pointer relative max-h-80 overflow-hidden rounded-md">
                <AspectRatio ratio={16/9}>
                  <img
                    src={primaryImage.path}
                    alt="Primary result"
                    className="w-full h-full object-contain hover:opacity-90 transition-opacity"
                    onClick={() => handleImageClick(primaryImage.path)}
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                      e.currentTarget.alt = 'Image not found';
                    }}
                  />
                </AspectRatio>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => handleImageClick(primaryImage.path)}>
                Open in viewer
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleShowProperties(primaryImage.path)}>
                Properties
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
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
              <ContextMenu key={image.id}>
                <ContextMenuTrigger>
                  <div className="h-24 rounded-md overflow-hidden">
                    <img
                      src={image.path}
                      alt="Related"
                      className="h-full w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => handleImageClick(image.path)}
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                        e.currentTarget.alt = 'Image not found';
                      }}
                    />
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => handleImageClick(image.path)}>
                    Open in viewer
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleShowProperties(image.path)}>
                    Properties
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        </div>
      )}

      {/* Image Properties Dialog */}
      <ImagePropertiesDialog
        isOpen={!!showingProperties}
        onClose={handleClosePropertiesDialog}
        properties={imageProperties}
        imagePath={showingProperties || undefined}
      />
    </motion.div>
  );
};

export default EnhancedSearchResult;
