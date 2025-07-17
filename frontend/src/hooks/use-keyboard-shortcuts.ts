
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/redux/store';
import { toast } from './use-toast';
import { clearCurrentQuery } from '@/redux/slices/chatSlice';

export function useKeyboardShortcuts() {
  let navigate;
  let dispatch;
  
  try {
    navigate = useNavigate();
    dispatch = useAppDispatch();
  } catch (e) {
    console.error('useKeyboardShortcuts must be used within a Router context');
    return; // Exit early if not in Router context
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Ctrl or Cmd key is pressed
      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      
      // New chat: Ctrl+N
      if (ctrlOrCmd && e.key === 'n') {
        e.preventDefault();
        dispatch(clearCurrentQuery());
        navigate('/');
        toast({
          title: "New Chat",
          description: "Started a new chat session",
        });
      }
      
      // Save session: Ctrl+S
      else if (ctrlOrCmd && e.key === 's') {
        e.preventDefault();
        toast({
          title: "Saved",
          description: "Session saved to library",
        });
      }
      
      // Navigation shortcuts
      else if (ctrlOrCmd && e.key === '1') {
        e.preventDefault();
        navigate('/');
      }
      else if (ctrlOrCmd && e.key === '2') {
        e.preventDefault();
        navigate('/library');
      }
      else if (ctrlOrCmd && e.key === '3') {
        e.preventDefault();
        navigate('/albums');
      }
      else if (ctrlOrCmd && e.key === '4') {
        e.preventDefault();
        navigate('/settings');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate, dispatch]);
}

export default useKeyboardShortcuts;
