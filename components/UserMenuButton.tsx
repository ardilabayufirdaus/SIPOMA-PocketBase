import React from 'react';
import { motion } from 'framer-motion';
import UserIcon from './icons/UserIcon';
import { User } from '../types';

interface UserMenuButtonProps {
  currentUser: User | null;
  isUserMenuOpen: boolean;
  onToggle: () => void;
  t: Record<string, string>;
}

const UserMenuButton: React.FC<UserMenuButtonProps> = ({
  currentUser,
  isUserMenuOpen,
  onToggle,
  t,
}) => {
  return (
    <div className="relative flex flex-col items-center gap-1">
      <motion.div
        className="relative cursor-pointer p-1 rounded-full hover:bg-white/10 dark:hover:bg-black/10 transition-all duration-300 group"
        onClick={onToggle}
        aria-label={isUserMenuOpen ? 'Close user menu' : 'Open user menu'}
        aria-expanded={isUserMenuOpen}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <motion.div
          className="relative w-10 h-10 flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          {currentUser?.avatar_url ? (
            <div className="relative w-10 h-10">
              <img
                className="w-full h-full rounded-full object-cover transition-all duration-200"
                src={currentUser.avatar_url}
                alt="User avatar"
              />
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
          ) : (
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center transition-all duration-200 shadow-md group-hover:shadow-lg">
              <UserIcon className="w-6 h-6 text-white" />
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
            </div>
          )}
        </motion.div>
        <span className="sr-only">{isUserMenuOpen ? 'Close user menu' : 'Open user menu'}</span>
      </motion.div>
      <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
        {t.profile || 'Profile'}
      </span>
    </div>
  );
};

export default UserMenuButton;
