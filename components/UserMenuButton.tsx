import React from 'react';
import { motion } from 'framer-motion';
import UserIcon from './icons/UserIcon';
import { User } from '../types';
import { Page } from '../types';

interface UserMenuButtonProps {
  currentUser: User | null;
  onNavigate: (page: Page) => void;
}

const UserMenuButton: React.FC<UserMenuButtonProps> = ({ currentUser, onNavigate }) => {
  const handleClick = () => {
    onNavigate('settings');
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative flex items-center justify-center"
    >
      <button
        type="button"
        className="relative cursor-pointer p-0.5 rounded-full transition-all duration-200 group ring-1 ring-white/10 hover:ring-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/60 active:scale-95"
        onClick={handleClick}
        aria-label="Buka Pengaturan Pengguna"
        title={currentUser?.full_name || 'Pengaturan Profil'}
      >
        <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center">
          {currentUser?.avatar_url ? (
            <div className="relative w-full h-full">
              <img
                className="w-full h-full rounded-full object-cover shadow-inner"
                src={currentUser.avatar_url}
                alt={currentUser?.full_name || 'User avatar'}
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-xs"></div>
            </div>
          ) : (
            <div className="relative w-full h-full rounded-full bg-slate-800 flex items-center justify-center shadow-inner group-hover:bg-slate-700 transition-colors">
              <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-xs"></div>
            </div>
          )}
        </div>
      </button>
    </motion.div>
  );
};

export default UserMenuButton;
