
import React from 'react';
import { motion } from 'framer-motion';
import { SaveAll, Download, Trash } from 'lucide-react';
import { format } from 'date-fns';

interface SessionCardProps {
  id: string;
  name: string;
  timestamp: string;
  thumbnails: string[];
  onClick: () => void;
  onDelete: () => void;
  onSave: () => void;
  onExport: () => void;
  isSelected?: boolean;
}

const SessionCard: React.FC<SessionCardProps> = ({
  id,
  name,
  timestamp,
  thumbnails,
  onClick,
  onDelete,
  onSave,
  onExport,
  isSelected = false,
}) => {
  const formattedDate = format(new Date(timestamp), 'MMM d, yyyy');

  return (
    <motion.div
      className={`rounded-lg overflow-hidden border border-border bg-card relative ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      whileHover={{ y: -5 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="aspect-video relative" onClick={onClick}>
        <div className="grid grid-cols-2 gap-1 h-full">
          {thumbnails.length > 0 ? (
            thumbnails.slice(0, 2).map((thumbnail, index) => (
              <img
                key={index}
                src={thumbnail}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            ))
          ) : (
            <div className="col-span-2 h-full bg-muted flex items-center justify-center">
              No images
            </div>
          )}
        </div>

        {/* Overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-3 flex flex-col justify-end opacity-0 hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-2 right-2 flex space-x-1">
            <motion.button
              className="p-1.5 rounded-full bg-background/50 hover:bg-background/80 text-white"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onSave();
              }}
            >
              <SaveAll size={14} />
            </motion.button>
            <motion.button
              className="p-1.5 rounded-full bg-background/50 hover:bg-background/80 text-white"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onExport();
              }}
            >
              <Download size={14} />
            </motion.button>
            <motion.button
              className="p-1.5 rounded-full bg-background/50 hover:bg-background/80 text-white"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash size={14} />
            </motion.button>
          </div>
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-medium truncate">{name}</h3>
        <p className="text-xs text-muted-foreground">{formattedDate}</p>
      </div>
    </motion.div>
  );
};

export default SessionCard;
