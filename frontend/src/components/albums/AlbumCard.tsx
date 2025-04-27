
import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface AlbumCardProps {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  createdAt: string;
  onClick: () => void;
  isSelected?: boolean;
}

const AlbumCard: React.FC<AlbumCardProps> = ({
  id,
  name,
  description,
  coverImage,
  createdAt,
  onClick,
  isSelected = false,
}) => {
  const formattedDate = format(new Date(createdAt), 'MMM d, yyyy');
  
  return (
    <motion.div
      className={`rounded-lg overflow-hidden border border-border bg-card ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      whileHover={{ y: -5 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
    >
      <div className="aspect-square">
        {coverImage ? (
          <img
            src={coverImage}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            No cover
          </div>
        )}
      </div>
      
      <div className="p-3">
        <h3 className="font-medium truncate">{name}</h3>
        <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
        <p className="text-xs text-muted-foreground mt-1">{formattedDate}</p>
      </div>
    </motion.div>
  );
};

export default AlbumCard;
