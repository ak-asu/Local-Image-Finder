
import React from 'react';
import { motion } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '@/redux/store';
import { setTheme } from '@/redux/slices/uiSlice';
import SettingsPanel from '@/components/settings/SettingsPanel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoonIcon, SunIcon, Laptop } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

const Settings: React.FC = () => {
  const dispatch = useAppDispatch();
  const profiles = useAppSelector((state) => state.user.profiles);
  const theme = useAppSelector((state) => state.ui.theme);
  
  const handleThemeChange = (value: 'light' | 'dark' | 'system') => {
    dispatch(setTheme(value));
  };
  
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold mb-4">Settings</h1>
        <p className="text-muted-foreground">
          Configure your image search settings for each profile.
        </p>
      </motion.div>

      <section className="mb-8 bg-card p-6 rounded-lg border border-border">
        <h2 className="text-lg font-semibold mb-4">Theme</h2>
        
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1 grid grid-cols-3 gap-3">
            <div
              className={`p-4 border border-border rounded-md cursor-pointer transition-all hover:bg-secondary/50 ${
                theme === 'light' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleThemeChange('light')}
            >
              <div className="w-full h-24 bg-white rounded-md mb-2 flex items-center justify-center">
                <SunIcon className="text-black" size={24} />
              </div>
              <div className="text-center">Light</div>
            </div>
            
            <div
              className={`p-4 border border-border rounded-md cursor-pointer transition-all hover:bg-secondary/50 ${
                theme === 'dark' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleThemeChange('dark')}
            >
              <div className="w-full h-24 bg-black rounded-md mb-2 flex items-center justify-center">
                <MoonIcon className="text-white" size={24} />
              </div>
              <div className="text-center">Dark</div>
            </div>
            
            <div
              className={`p-4 border border-border rounded-md cursor-pointer transition-all hover:bg-secondary/50 ${
                theme === 'system' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleThemeChange('system')}
            >
              <div className="w-full h-24 bg-gradient-to-r from-white to-black rounded-md mb-2 flex items-center justify-center">
                <Laptop className="text-gray-500" size={24} />
              </div>
              <div className="text-center">System</div>
            </div>
          </div>
          
          <div className="md:w-56">
            <Select
              value={theme}
              onValueChange={(value) => handleThemeChange(value as 'light' | 'dark' | 'system')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light Theme</SelectItem>
                <SelectItem value="dark">Dark Theme</SelectItem>
                <SelectItem value="system">System Default</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-lg font-semibold mb-4">Profile Settings</h2>
        {profiles.map((profile) => (
          <SettingsPanel
            key={profile.id}
            profileId={profile.id}
            profileName={profile.name}
          />
        ))}
      </section>
    </div>
  );
};

export default Settings;
