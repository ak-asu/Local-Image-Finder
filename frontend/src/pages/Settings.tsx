
import React from 'react';
import { motion } from 'framer-motion';
import { useAppSelector } from '@/redux/store';
import SettingsPanel from '@/components/settings/SettingsPanel';

const Settings: React.FC = () => {
  const profiles = useAppSelector((state) => state.user.profiles);
  const theme = useAppSelector((state) => state.ui.theme);
  
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

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Theme</h2>
        <div className="flex space-x-3">
          <div
            className={`p-4 border border-border rounded-md cursor-pointer ${
              theme === 'light' ? 'ring-2 ring-primary' : ''
            }`}
          >
            <div className="w-full h-24 bg-white rounded-md mb-2"></div>
            <div className="text-center">Light</div>
          </div>
          
          <div
            className={`p-4 border border-border rounded-md cursor-pointer ${
              theme === 'dark' ? 'ring-2 ring-primary' : ''
            }`}
          >
            <div className="w-full h-24 bg-black rounded-md mb-2"></div>
            <div className="text-center">Dark</div>
          </div>
          
          <div
            className={`p-4 border border-border rounded-md cursor-pointer ${
              theme === 'system' ? 'ring-2 ring-primary' : ''
            }`}
          >
            <div className="w-full h-24 bg-gradient-to-r from-white to-black rounded-md mb-2"></div>
            <div className="text-center">System</div>
          </div>
        </div>
      </section>

      <section>
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
