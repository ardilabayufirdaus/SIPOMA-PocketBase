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
      <div
        className="relative cursor-pointer p-0.5 rounded-full transition-all duration-200 group ring-1 ring-white/10 hover:ring-white/30"
        onClick={handleClick}
        aria-label="Open settings"
      >
        <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center">
          {currentUser?.avatar_url ? (
            <div className="relative w-full h-full">
              <img
                className="w-full h-full rounded-full object-cover shadow-inner"
                src={currentUser.avatar_url}
                alt="User avatar"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#1e1e1e]"></div>
            </div>
          ) : (
            <div className="relative w-full h-full rounded-full bg-[#E95420] flex items-center justify-center shadow-inner group-hover:bg-[#f06437] transition-colors">
              <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#1e1e1e] rounded-full"></div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default UserMenuButton;
