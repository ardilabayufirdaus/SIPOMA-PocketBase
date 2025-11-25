import React from 'react';
import UserIcon from './icons/UserIcon';
import { User } from '../types';
import { Page } from '../App';

interface UserMenuButtonProps {
  currentUser: User | null;
  onNavigate: (page: Page) => void;
  t: Record<string, string>;
}

const UserMenuButton: React.FC<UserMenuButtonProps> = ({ currentUser, onNavigate, t }) => {
  const handleClick = () => {
    onNavigate('settings');
  };

  return (
    <div className="relative flex flex-col items-center gap-1">
      <div
        className="relative cursor-pointer p-1 rounded-full hover:bg-white/10 transition-all duration-300 group"
        onClick={handleClick}
        aria-label="Open settings"
      >
        <div className="relative w-10 h-10 flex items-center justify-center">
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
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
            </div>
          )}
        </div>
        <span className="sr-only">Open settings</span>
      </div>
      <span className="text-xs text-slate-300 font-medium">{t.profile || 'Profile'}</span>
    </div>
  );
};

export default UserMenuButton;


