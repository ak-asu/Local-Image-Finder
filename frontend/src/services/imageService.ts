
import api from './api';

const imageService = {
  openInSystemViewer: async (imagePath: string): Promise<void> => {
    await api.post('/image/open', { path: imagePath });
  },
  
  getImageProperties: async (imagePath: string): Promise<Record<string, any>> => {
    const response = await api.get('/properties', {
      params: { path: imagePath }
    });
    return response.data;
  },
};

export default imageService;
