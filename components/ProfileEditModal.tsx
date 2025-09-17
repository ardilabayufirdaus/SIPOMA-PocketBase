import React, { useState, useRef, useEffect } from 'react';
import Modal from './Modal';
import { User } from '../types';
import UserIcon from './icons/UserIcon';
import PhotoIcon from './icons/PhotoIcon';
import { supabase } from '../utils/supabase';
import { v4 as uuidv4 } from 'uuid';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (user: User) => void;
  t: any;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
  t,
}) => {
  const [fullName, setFullName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      setFullName(user.full_name);
      setAvatarPreview(user.avatar_url || null);
      setUploadedAvatarUrl(user.avatar_url || null);
      setUploadError(null);
    }
  }, [isOpen, user]);

  const validateFile = (file: File): string | null => {
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return t.upload_avatar_error_size || 'File size must be less than 5MB';
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return t.upload_avatar_error_type || 'File must be an image (JPEG, PNG, GIF, or WebP)';
    }

    return null;
  };

  const uploadFileToSupabase = async (file: File): Promise<string | null> => {
    try {
      // Ensure user is logged in (check localStorage)
      if (!user) {
        throw new Error('User not logged in');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${uuidv4()}.${fileExt}`;
      const filePath = `${fileName}`; // Direct to root of avatars bucket

      console.log('Uploading file to avatars bucket:', filePath);

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

      if (!data?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded file');
      }

      console.log('Public URL generated:', data.publicUrl);
      return data.publicUrl;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase
      const publicUrl = await uploadFileToSupabase(file);
      setUploadedAvatarUrl(publicUrl);
    } catch (error: any) {
      console.error('Upload failed:', error);
      setUploadError(error.message || t.upload_avatar_error_upload || 'Failed to upload image');
      setAvatarPreview(user?.avatar_url || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    if (!user) return;

    onSave({
      ...user,
      full_name: fullName,
      avatar_url: uploadedAvatarUrl || user.avatar_url,
    });
  };

  if (!user) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.edit_profile_title}>
      <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            {avatarPreview ? (
              <img
                className="h-24 w-24 rounded-full object-cover"
                src={avatarPreview}
                alt="Avatar preview"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <UserIcon className="h-12 w-12 text-slate-500 dark:text-slate-400" />
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute -bottom-1 -right-1 p-2 bg-white dark:bg-slate-600 rounded-full shadow-md border border-slate-200 dark:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <div className="w-5 h-5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <PhotoIcon className="w-5 h-5 text-slate-600 dark:text-slate-200" />
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              disabled={isUploading}
            />
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-sm font-semibold text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? t.uploading || 'Uploading...' : t.upload_avatar}
          </button>
          {uploadError && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">
              {uploadError}
            </div>
          )}
        </div>
        <div>
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {t.full_name_label}
          </label>
          <input
            type="text"
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 input-style"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {t.email_label}
          </label>
          <input
            type="email"
            id="email"
            value={user?.email ?? ''}
            disabled
            className="mt-1 input-style bg-slate-100 dark:bg-slate-700 cursor-not-allowed"
          />
        </div>
      </div>
      <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex justify-end gap-3 rounded-b-xl border-t border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600"
        >
          {t.cancel_button}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isUploading}
          className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t.save_changes}
        </button>
      </div>
    </Modal>
  );
};

export default ProfileEditModal;
