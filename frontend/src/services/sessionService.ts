import api from './api';
import { v4 as uuidv4 } from 'uuid';

// Mock data for development when backend is unavailable
const MOCK_SESSIONS = [
  {
    id: uuidv4(),
    name: 'Beach sunset',
    query: 'sunset on the beach',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    thumbnails: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=500&h=500&fit=crop'
    ]
  },
  {
    id: uuidv4(),
    name: 'Mountain landscapes',
    query: 'mountain peaks with snow',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    thumbnails: [
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=500&h=500&fit=crop'
    ]
  },
  {
    id: uuidv4(),
    name: 'City skyline',
    query: 'night city skyline',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    thumbnails: [
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&h=500&fit=crop'
    ]
  }
];

// Check if backend is available (can be set by a heartbeat check)
let useBackend = true;

export interface Session {
  id: string;
  name: string;
  query: string;
  queryImage?: string;
  timestamp: string;
  thumbnails: string[];
}

const sessionService = {
  getSessions: async (): Promise<Session[]> => {
    try {
      if (!useBackend) {
        console.log('Using mock sessions data (backend unavailable)');
        return [...MOCK_SESSIONS];
      }
      
      const response = await api.get('/sessions');
      
      // Check if the response contains HTML (indicating API is not ready)
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        console.warn('Received HTML instead of JSON. Backend API may not be running properly.');
        useBackend = false; // Switch to mock mode
        return [...MOCK_SESSIONS];
      }
      
      // Ensure the response data is an array
      if (!Array.isArray(response.data)) {
        console.error('Expected array from /sessions API but got:', typeof response.data);
        useBackend = false; // Switch to mock mode
        return [...MOCK_SESSIONS];
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      useBackend = false; // Switch to mock mode
      return [...MOCK_SESSIONS]; 
    }
  },
  
  getSession: async (id: string): Promise<Session> => {
    try {
      if (!useBackend) {
        const session = MOCK_SESSIONS.find(s => s.id === id);
        if (session) return { ...session };
        throw new Error('Session not found');
      }
      
      const response = await api.get(`/sessions/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching session ${id}:`, error);
      
      // Try to find session in mock data as fallback
      const mockSession = MOCK_SESSIONS.find(s => s.id === id);
      if (mockSession) return { ...mockSession };
      
      throw error;
    }
  },
  
  saveSession: async (sessionData: Omit<Session, 'id'>): Promise<Session> => {
    try {
      if (!useBackend) {
        // Create mock session with generated ID
        const newSession = {
          id: uuidv4(),
          ...sessionData
        };
        MOCK_SESSIONS.unshift(newSession);
        return { ...newSession };
      }
      
      const response = await api.post('/sessions', sessionData);
      return response.data;
    } catch (error) {
      console.error('Error saving session:', error);
      
      if (!useBackend) {
        // Create mock session with generated ID even in error case
        const newSession = {
          id: uuidv4(),
          ...sessionData
        };
        MOCK_SESSIONS.unshift(newSession);
        return { ...newSession };
      }
      
      throw error;
    }
  },
  
  updateSession: async (id: string, sessionData: Partial<Omit<Session, 'id'>>): Promise<Session> => {
    try {
      if (!useBackend) {
        const index = MOCK_SESSIONS.findIndex(s => s.id === id);
        if (index === -1) throw new Error('Session not found');
        
        MOCK_SESSIONS[index] = { ...MOCK_SESSIONS[index], ...sessionData };
        return { ...MOCK_SESSIONS[index] };
      }
      
      const response = await api.put(`/sessions/${id}`, sessionData);
      return response.data;
    } catch (error) {
      console.error(`Error updating session ${id}:`, error);
      throw error;
    }
  },
  
  deleteSession: async (id: string): Promise<void> => {
    try {
      if (!useBackend) {
        const index = MOCK_SESSIONS.findIndex(s => s.id === id);
        if (index !== -1) {
          MOCK_SESSIONS.splice(index, 1);
        }
        return;
      }
      
      await api.delete(`/sessions/${id}`);
    } catch (error) {
      console.error(`Error deleting session ${id}:`, error);
      
      // If using mock data, delete from mock even if API fails
      if (!useBackend) {
        const index = MOCK_SESSIONS.findIndex(s => s.id === id);
        if (index !== -1) {
          MOCK_SESSIONS.splice(index, 1);
        }
        return;
      }
      
      throw error;
    }
  },
  
  bulkDeleteSessions: async (ids: string[]): Promise<void> => {
    try {
      if (!useBackend) {
        ids.forEach(id => {
          const index = MOCK_SESSIONS.findIndex(s => s.id === id);
          if (index !== -1) {
            MOCK_SESSIONS.splice(index, 1);
          }
        });
        return;
      }
      
      await api.delete('/sessions', {
        data: { ids }
      });
    } catch (error) {
      console.error(`Error bulk deleting sessions:`, error);
      
      // If using mock data, delete from mock even if API fails
      if (!useBackend) {
        ids.forEach(id => {
          const index = MOCK_SESSIONS.findIndex(s => s.id === id);
          if (index !== -1) {
            MOCK_SESSIONS.splice(index, 1);
          }
        });
        return;
      }
      
      throw error;
    }
  },
};

export default sessionService;
