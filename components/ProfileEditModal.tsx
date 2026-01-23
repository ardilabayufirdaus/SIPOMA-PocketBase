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
  t: Record<string, string>;
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
      } catch {
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
      } catch {
        if (attempt < maxRetries && !abortControllerRef.current?.signal.aborted) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
          return uploadFileToPocketBase(file, attempt + 1);
        }

        throw new Error('Failed to upload avatar');
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
    } catch {
      const errorMessage = 'Failed to upload image';
      setUploadError(errorMessage);
      setAvatarPreview(user?.avatar_url || null);
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
    <Modal isOpen={isOpen} onClose={onClose} title={t.edit_profile_title} maxWidth="2xl">
      <div className="max-h-[85vh] overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
          {/* Header Section */}
          <div className="text-center">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent mb-2">
              {t.edit_profile_title}
            </h2>
            <p className="text-slate-600 text-sm">Update your profile information and avatar</p>
          </div>

          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-6">
            <div className="relative group">
              <div className="relative">
                {avatarPreview ? (
                  <div className="relative">
                    <img
                      className="h-32 w-32 lg:h-40 lg:w-40 rounded-full object-cover ring-4 ring-white shadow-2xl transition-all duration-300 group-hover:ring-blue-200"
                      src={avatarPreview}
                      alt="Avatar preview"
                    />
                    <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/10 transition-all duration-300"></div>
                  </div>
                ) : (
                  <div className="h-32 w-32 lg:h-40 lg:w-40 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl ring-4 ring-white">
                    <UserIcon className="h-16 w-16 lg:h-20 lg:w-20 text-white" />
                  </div>
                )}

                {/* Upload Button Overlay */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isCompressing}
                  className="absolute -bottom-2 -right-2 p-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-110"
                  aria-label="Upload avatar"
                >
                  {isCompressing ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : isUploading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <PhotoIcon className="w-6 h-6" />
                  )}
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                disabled={isUploading}
              />
            </div>

            {/* Upload Status */}
            <div className="text-center space-y-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isCompressing}
                className="text-sm font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isCompressing
                  ? 'Compressing image...'
                  : isUploading
                    ? `Uploading... ${uploadProgress}%`
                    : 'Change avatar'}
              </button>

              {/* Progress Bar */}
              {isUploading && (
                <div className="w-full max-w-xs mx-auto">
                  <div className="bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {uploadError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 max-w-md mx-auto">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 text-blue-600 mt-0.5">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-red-900 mb-1">Upload Failed</h4>
                      <p className="text-sm text-red-700">{uploadError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {uploadedAvatarUrl && !isUploading && !uploadError && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 max-w-md mx-auto">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 text-green-600 mt-0.5">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-green-900 mb-1">Avatar Updated</h4>
                      <p className="text-sm text-green-700">
                        Your profile picture has been successfully updated.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Section */}
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-slate-600" />
                Personal Information
              </h3>

              <div className="space-y-6">
                {/* Full Name */}
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    {t.full_name_label}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 pl-12 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      placeholder="Enter your full name"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                      <UserIcon className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    {t.email_label}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      value={user?.email ?? ''}
                      disabled
                      className="w-full px-4 py-3 pl-12 border border-slate-200 rounded-xl bg-slate-50/50 backdrop-blur-sm cursor-not-allowed text-slate-500"
                      placeholder="Your email address"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-300">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                </div>

                {/* Username (Read-only) */}
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="username"
                      value={user?.username ?? ''}
                      disabled
                      className="w-full px-4 py-3 pl-12 border border-slate-200 rounded-xl bg-slate-50/50 backdrop-blur-sm cursor-not-allowed text-slate-500"
                      placeholder="Your username"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-300">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Username cannot be changed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl shadow-sm hover:bg-slate-50 hover:shadow-md transition-all duration-200"
            >
              {t.cancel_button}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isUploading || isCompressing || !fullName.trim()}
              className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              {isUploading || isCompressing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                t.save_changes
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProfileEditModal;
