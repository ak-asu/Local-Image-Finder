
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ImagePropertiesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Record<string, any> | null;
  imagePath?: string;
}

const ImagePropertiesDialog: React.FC<ImagePropertiesDialogProps> = ({
  isOpen,
  onClose,
  properties,
  imagePath,
}) => {
  if (!properties) return null;

  // Format the file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  // Format the date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Image Properties</DialogTitle>
          <DialogDescription>
            Details for {imagePath?.split('/').pop() || 'this image'}
          </DialogDescription>
        </DialogHeader>
        
        {imagePath && (
          <div className="flex justify-center mb-4">
            <img 
              src={imagePath}
              alt="Preview"
              className="max-h-36 object-contain rounded-md"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
                e.currentTarget.alt = 'Image not found';
              }}
            />
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto">
          {Object.entries(properties).map(([key, value]) => {
            let displayValue = value;
            
            // Format specific values based on key name
            if (key.toLowerCase().includes('size') && typeof value === 'number') {
              displayValue = formatFileSize(value);
            } else if ((key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) && typeof value === 'string') {
              displayValue = formatDate(value);
            } else if (typeof value === 'object') {
              displayValue = JSON.stringify(value);
            }
            
            return (
              <React.Fragment key={key}>
                <div className="font-medium text-sm">{key}:</div>
                <div className="text-sm truncate" title={String(displayValue)}>
                  {String(displayValue)}
                </div>
              </React.Fragment>
            );
          })}
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImagePropertiesDialog;
