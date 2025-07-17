
import api from './api';

interface Album {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  createdAt: string;
  isAutoCreated: boolean;
  images: any[];
}

interface CreateAlbumParams {
  name: string;
  description?: string;
  imageIds: string[];
}

const albumService = {
  getAlbums: async (): Promise<Album[]> => {
    const response = await api.get('/albums');
    return response.data;
  },
  
  getAlbum: async (id: string): Promise<Album> => {
    const response = await api.get(`/albums/${id}`);
    return response.data;
  },
  
  createAlbum: async (params: CreateAlbumParams): Promise<Album> => {
    const response = await api.post('/albums', params);
    return response.data;
  },
  
  updateAlbum: async (id: string, params: Partial<CreateAlbumParams>): Promise<Album> => {
    const response = await api.put(`/albums/${id}`, params);
    return response.data;
  },
  
  deleteAlbum: async (id: string): Promise<void> => {
    await api.delete(`/albums/${id}`);
  },
  
  addImagesToAlbum: async (id: string, imageIds: string[]): Promise<Album> => {
    const response = await api.post(`/albums/${id}/images`, { imageIds });
    return response.data;
  },
  
  removeImagesFromAlbum: async (id: string, imageIds: string[]): Promise<Album> => {
    const response = await api.delete(`/albums/${id}/images`, { 
      data: { imageIds } 
    });
    return response.data;
  },
};

export default albumService;
