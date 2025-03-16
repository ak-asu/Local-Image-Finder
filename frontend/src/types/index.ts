// Enums
export enum ThemeMode {
  LIGHT = "light",
  DARK = "dark",
  SYSTEM = "system"
}

export enum ModelType {
  DEFAULT = "default",
  PERFORMANCE = "performance",
  QUALITY = "quality"
}

export enum AlbumType {
  MANUAL = "manual",
  AUTO = "auto",
  RECOMMENDED = "recommended"
}

// Profile related types
export interface ProfileSettings {
  similar_image_count: number;
  monitored_folders: string[];
  theme_mode: ThemeMode;
  custom_theme_colors?: Record<string, string>;
  similarity_threshold: number;
  nlp_model: ModelType;
  vlm_model: ModelType;
  auto_index_interval_minutes: number;
  last_indexed?: string;
}

export interface Profile {
  id: string;
  name: string;
  avatar?: string;
  created_at: string;
  last_accessed: string;
  settings: ProfileSettings;
  is_default: boolean;
}

// Image related types
export interface ImageMetadata {
  filename: string;
  filepath: string;
  filesize: number;
  width?: number;
  height?: number;
  creation_date?: string;
  modified_date?: string;
  exif?: Record<string, any>;
  exists?: boolean;
}

export interface Image {
  id: string;
  metadata: ImageMetadata;
  embedding_id: string;
  last_indexed: string;
}

export interface ImageSearchResult {
  image: Image;
  similarity_score: number;
  exists: boolean;
}

// Search and session related types
export interface SearchQuery {
  id: string;
  text?: string;
  image_paths?: string[];
  timestamp: string;
  model_settings?: Record<string, any>;
}

export interface Session {
  id: string;
  profile_id: string;
  name?: string;
  queries: SearchQuery[];
  result_ids: string[];
  created_at: string;
  updated_at: string;
}

// Album related types
export interface AlbumImage {
  image_id: string;
  order: number;
  added_at: string;
}

export interface Album {
  id: string;
  name: string;
  description?: string;
  cover_image_id?: string;
  profile_id: string;
  type: AlbumType;
  created_at: string;
  updated_at: string;
  search_query?: string;
  images: AlbumImage[];
}

// UI related types
export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  action: string;
  disabled?: boolean;
  divider?: boolean;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
}
