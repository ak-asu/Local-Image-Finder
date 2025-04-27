
import api from './api';

interface Session {
  id: string;
  name: string;
  query: string;
  queryImage?: string;
  timestamp: string;
  thumbnails: string[];
}

const sessionService = {
  getSessions: async (): Promise<Session[]> => {
    const response = await api.get('/sessions');
    return response.data;
  },
  
  getSession: async (id: string): Promise<any> => {
    const response = await api.get(`/sessions/${id}`);
    return response.data;
  },
  
  saveSession: async (sessionData: Omit<Session, 'id'>): Promise<Session> => {
    const response = await api.post('/sessions', sessionData);
    return response.data;
  },
  
  updateSession: async (id: string, sessionData: Partial<Omit<Session, 'id'>>): Promise<Session> => {
    const response = await api.put(`/sessions/${id}`, sessionData);
    return response.data;
  },
  
  deleteSession: async (id: string): Promise<void> => {
    await api.delete(`/sessions/${id}`);
  },
  
  bulkDeleteSessions: async (ids: string[]): Promise<void> => {
    await api.delete('/sessions', {
      data: { ids }
    });
  },
};

export default sessionService;
