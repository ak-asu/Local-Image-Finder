
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="h-full flex items-center justify-center p-4">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-9xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-medium mb-4">Page not found</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          Sorry, we couldn't find the page you're looking for. It might have been removed or doesn't exist.
        </p>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 p-2 rounded-md bg-primary text-primary-foreground"
        >
          <ArrowLeft size={18} />
          <span>Return to home</span>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
