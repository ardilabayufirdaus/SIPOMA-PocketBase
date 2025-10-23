import React, { useState, useRef, useEffect, useCallback } from 'react';
import Modal from './Modal';
import { User } from '../types';
import UserIcon from './icons/UserIcon';
import PhotoIcon from './icons/PhotoIcon';
import { pb } from '../utils/pocketbase-simple';

// Utility functions for image optimization
const compressImage = (
  file: File,
  maxWidth: number = 800,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file); // Fallback to original
          }
        },
        file.type,
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
};

const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.src = URL.createObjectURL(file);
  });
};

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      setFullName(user.full_name);
      setAvatarPreview(user.avatar_url || null);
      setUploadedAvatarUrl(user.avatar_url || null);
      setUploadError(null);
      setUploadProgress(0);
      setRetryCount(0);
    }
  }, [isOpen, user]);

  const validateFile = useCallback(
    async (file: File): Promise<string | null> => {
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

      // Check dimensions (optional, prevent extremely large images)
      try {
        const dimensions = await getImageDimensions(file);
        if (dimensions.width > 4096 || dimensions.height > 4096) {
          return 'Image dimensions too large (max 4096x4096)';
        }
      } catch (error) {
        // Ignore dimension check errors
      }

      return null;
    },
    [t]
  );

  const uploadFileToPocketBase = useCallback(
    async (file: File, attempt: number = 1): Promise<string | null> => {
      const maxRetries = 3;
      abortControllerRef.current = new AbortController();

      try {
        if (!user) {
          throw new Error('User not logged in');
        }

        // Prepare FormData object for file upload to PocketBase
        const formData = new FormData();
        formData.append('avatar', file); // 'avatar' is the name of the field in PocketBase

        // Update the user with the new avatar
        const updatedUser = await pb.collection('users').update(user.id, formData);

        if (!updatedUser || !updatedUser.avatar) {
          throw new Error('Failed to upload avatar to PocketBase');
        }

        // Get the file URL from PocketBase
        const avatarUrl = pb.files.getUrl(updatedUser, updatedUser.avatar);

        if (!avatarUrl) {
          throw new Error('Failed to get avatar URL from PocketBase');
        }

        return avatarUrl;
      } catch (error: unknown) {
        console.error(`Upload attempt ${attempt} failed:`, error);

        if (attempt < maxRetries && !abortControllerRef.current?.signal.aborted) {
          setRetryCount(attempt);
          await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
          return uploadFileToPocketBase(file, attempt + 1);
        }

        throw error;
      }
    },
    [user]
  );

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset states
    setUploadError(null);
    setUploadProgress(0);
    setRetryCount(0);

    // Validate file
    const validationError = await validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setIsCompressing(true);

    try {
      // Compress image for better performance
      const compressedFile = await compressImage(file);
      setIsCompressing(false);
      setIsUploading(true);

      // Create preview from compressed file
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);

      // Upload to PocketBase with retry
      const publicUrl = await uploadFileToPocketBase(compressedFile);
      setUploadedAvatarUrl(publicUrl);
      setUploadProgress(100);
    } catch (error: unknown) {
      console.error('Upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setUploadError(errorMessage || t.upload_avatar_error_upload || 'Failed to upload image');
      setAvatarPreview(user?.avatar_url || null);
      setRetryCount((prev) => prev + 1);
    } finally {
      setIsUploading(false);
      setIsCompressing(false);
      setUploadProgress(0);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      // Update user data in PocketBase
      const formData = {
        name: fullName, // PocketBase menggunakan 'name' bukan 'full_name'
      };

      // If we have a new avatar, it's already been uploaded in the uploadFileToPocketBase function
      // So we don't need to include avatar in this update

      // Update user in PocketBase
      await pb.collection('users').update(user.id, formData);

      // Notify parent component about the update
      onSave({
        ...user,
        full_name: fullName,
        avatar_url: uploadedAvatarUrl || user.avatar_url,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to update profile:', err);
      // You might want to add proper error handling/notification here
    }
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
              disabled={isUploading || isCompressing}
              className="absolute -bottom-1 -right-1 p-2 bg-white dark:bg-slate-600 rounded-full shadow-md border border-slate-200 dark:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCompressing ? (
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : isUploading ? (
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
            disabled={isUploading || isCompressing}
            className="text-sm font-semibold text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCompressing
              ? t.compressing || 'Compressing...'
              : isUploading
                ? `${t.uploading || 'Uploading...'} ${uploadProgress}%`
                : t.upload_avatar}
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
          disabled={isUploading || isCompressing}
          className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t.save_changes}
        </button>
      </div>
    </Modal>
  );
};

export default ProfileEditModal;

