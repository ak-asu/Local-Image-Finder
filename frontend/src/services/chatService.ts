
import api from './api';

interface SearchParams {
  query?: string;
  image?: File | string;
  limit?: number;
  model?: string;
  threshold?: number;
  profileId?: string;
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

const API_BASE = 'http://localhost:8000';

function pathToUrl(filePath: string): string {
  if (!filePath) return '';
  // Serve local files through the backend to bypass Electron's webSecurity restrictions
  return `${API_BASE}/api/image/serve?path=${encodeURIComponent(filePath)}`;
}

function mapResult(r: any): SearchResult {
  const rawPath = r.path || r.imagePath || '';
  return {
    id: r.id,
    imagePath: pathToUrl(rawPath),
    score: r.similarity_score ?? r.score ?? 0,
    metadata: r.metadata,
  };
}

const chatService = {
  search: async (params: SearchParams): Promise<SearchResponse> => {
    let imageFile: string | undefined;

    if (params.image) {
      if (typeof params.image === 'string') {
        imageFile = params.image;
      } else {
        const reader = new FileReader();
        imageFile = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(params.image as File);
        });
      }
    }

    const body: Record<string, any> = {
      profile_id: params.profileId || 'default',
      limit: params.limit || 20,
    };
    if (params.query) body.query_text = params.query;
    if (imageFile) body.image_file = imageFile;
    if (params.threshold != null) body.similarity_threshold = params.threshold;

    const response = await api.post('/api/search/query', body);
    const data = response.data;

    const allResults: SearchResult[] = [
      ...(data.primary_results || []).map(mapResult),
      ...(data.related_results || []).map(mapResult),
    ];

    return {
      query: params.query || '',
      primaryResult: allResults[0],
      relatedResults: allResults.slice(1),
    };
  },

  getImageProperties: async (imageId: string, profileId = 'default'): Promise<Record<string, any>> => {
    const response = await api.get(`/api/search/properties/${imageId}`, { params: { profile_id: profileId } });
    return response.data;
  },

  saveSession: async (sessionData: any): Promise<{ id: string }> => {
    const response = await api.post('/api/library/sessions', sessionData);
    return response.data;
  },
};

export default chatService;
