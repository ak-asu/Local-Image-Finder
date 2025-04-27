
import api from './api';

interface SearchParams {
  query?: string;
  image?: File | string;
  limit?: number;
  model?: string;
  threshold?: number;
}

interface SearchResult {
  id: string;
  imagePath: string;
  score: number;
  metadata?: Record<string, any>;
}

interface SearchResponse {
  query: string;
  queryImage?: string;
  primaryResult?: SearchResult;
  relatedResults: SearchResult[];
}

const chatService = {
  search: async (params: SearchParams): Promise<SearchResponse> => {
    const formData = new FormData();
    
    if (params.query) {
      formData.append('query', params.query);
    }
    
    if (params.image) {
      if (typeof params.image === 'string') {
        // If image is a base64 string, convert to file
        const response = await fetch(params.image);
        const blob = await response.blob();
        formData.append('image', blob, 'query-image.jpg');
      } else {
        formData.append('image', params.image);
      }
    }
    
    if (params.limit) {
      formData.append('limit', params.limit.toString());
    }
    
    if (params.model) {
      formData.append('model', params.model);
    }
    
    if (params.threshold) {
      formData.append('threshold', params.threshold.toString());
    }
    
    const response = await api.post('/query', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },
  
  getImageProperties: async (imageId: string): Promise<Record<string, any>> => {
    const response = await api.get(`/properties/${imageId}`);
    return response.data;
  },
  
  saveSession: async (sessionData: any): Promise<{ id: string }> => {
    const response = await api.post('/sessions', sessionData);
    return response.data;
  },
};

export default chatService;
