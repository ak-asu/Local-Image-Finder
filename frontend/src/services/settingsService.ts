
import api from './api';

interface ProfileSettings {
  profileId: string;
  similarResultsCount: number;
  folderLocations: Array<{ id: string; path: string }>;
  similarityThreshold: number;
  selectedModel: string;
}

const settingsService = {
  getProfileSettings: async (profileId: string): Promise<ProfileSettings> => {
    const response = await api.get(`/settings/${profileId}`);
    return response.data;
  },
  
  updateProfileSettings: async (profileId: string, settings: Partial<ProfileSettings>): Promise<ProfileSettings> => {
    const response = await api.put(`/settings/${profileId}`, settings);
    return response.data;
  },
  
  getAvailableModels: async (): Promise<string[]> => {
    const response = await api.get('/settings/models');
    return response.data;
  },
};

export default settingsService;
