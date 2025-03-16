import { ipcRenderer } from 'electron';
import { format } from 'date-fns';
import { ImageMetadata } from '../types';

/**
 * Format file size to human readable format
 * @param bytes File size in bytes
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format date string to human readable format
 * @param dateString Date string in ISO format
 * @param formatString Format string for date-fns
 */
export const formatDate = (dateString?: string, formatString = 'PPpp'): string => {
  if (!dateString) return 'Unknown';
  try {
    const date = new Date(dateString);
    return format(date, formatString);
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateString;
  }
};

/**
 * Open image in system's default viewer
 * @param imagePath Path to image file
 */
export const openImageInSystemViewer = (imagePath: string): Promise<boolean> => {
  return ipcRenderer.invoke('open-image', imagePath);
};

/**
 * Extract file extension from filename
 * @param filename Filename with extension
 */
export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Check if a file is an image based on its extension
 * @param filename Filename with extension
 */
export const isImageFile = (filename: string): boolean => {
  const ext = getFileExtension(filename).toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
};

/**
 * Truncate string with ellipsis if it exceeds maxLength
 * @param str String to truncate
 * @param maxLength Maximum length before truncation
 */
export const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
};

/**
 * Format image properties for display
 * @param metadata Image metadata
 */
export const formatImageProperties = (metadata: ImageMetadata): Record<string, string> => {
  const properties: Record<string, string> = {
    'Filename': metadata.filename || 'Unknown',
    'Path': metadata.filepath || 'Unknown',
    'Size': formatFileSize(metadata.filesize || 0),
  };
  
  if (metadata.width && metadata.height) {
    properties['Dimensions'] = `${metadata.width} × ${metadata.height} px`;
  }
  
  if (metadata.creation_date) {
    properties['Created'] = formatDate(metadata.creation_date);
  }
  
  if (metadata.modified_date) {
    properties['Modified'] = formatDate(metadata.modified_date);
  }
  
  // Add EXIF data if available
  if (metadata.exif) {
    for (const [key, value] of Object.entries(metadata.exif)) {
      if (value) properties[key] = String(value);
    }
  }
  
  return properties;
};

/**
 * Create a downloadable file from data
 * @param data File content
 * @param filename Filename for download
 * @param type MIME type of file
 */
export const downloadFile = (data: string, filename: string, type = 'application/json'): void => {
  const blob = new Blob([data], { type });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(href);
};

/**
 * Export session data to JSON file
 * @param session Session data
 */
export const exportSessionToJson = (session: any): void => {
  const data = JSON.stringify(session, null, 2);
  const filename = `session-${session.id}-${format(new Date(), 'yyyy-MM-dd')}.json`;
  
  downloadFile(data, filename);
};

/**
 * Convert similarity score to percentage
 * @param score Similarity score (0-1)
 */
export const similarityToPercentage = (score: number): string => {
  return `${Math.round(score * 100)}%`;
};
