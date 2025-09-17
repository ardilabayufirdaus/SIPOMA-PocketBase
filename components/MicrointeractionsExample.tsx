/**
 * Microinteractions Implementation Examples
 * Demonstrating enhanced UX with smooth animations and interactions
 */

import React, { useState } from 'react';
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedInput,
  AnimatedIcon,
  LoadingSpinner,
  SuccessIndicator,
  ToastNotification,
  AnimatedProgressBar,
  animationUtils,
  useHoverInteraction,
  useClickInteraction,
  useLoadingAnimation,
} from '../utils/Microinteractions';
import { EnhancedButton, EnhancedCard, EnhancedInput } from './EnhancedComponents';

// =============================================================================
// ENHANCED DASHBOARD WITH MICROINTERACTIONS
// =============================================================================

interface EnhancedDashboardProps {
  onAction: (action: string) => void;
}

export const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({ onAction }) => {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleCardClick = (cardId: string) => {
    setSelectedCard(cardId);
    setToastMessage(`Selected ${cardId} card`);
    setShowToast(true);
    onAction(cardId);
  };

  const handleAction = (action: string) => {
    setToastMessage(`${action} action performed`);
    setShowToast(true);
    onAction(action);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header with animated elements */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white animate-fade-in">
            Enhanced Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 animate-fade-in animation-delay-200">
            Experience smooth interactions and delightful animations
          </p>
        </div>

        <div className="flex space-x-3">
          <AnimatedButton
            variant="secondary"
            size="sm"
            animationType="scale"
            onClick={() => handleAction('Refresh')}
          >
            <AnimatedIcon
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              }
              size="sm"
              animationType="spin"
            />
            Refresh
          </AnimatedButton>

          <AnimatedButton
            variant="primary"
            size="sm"
            animationType="bounce"
            onClick={() => handleAction('Create')}
          >
            Create New
          </AnimatedButton>
        </div>
      </div>

      {/* Stats Cards with hover animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatedCard
          animationType="lift"
          className={`${selectedCard === 'users' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => handleCardClick('users')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">2,543</p>
              <p className="text-xs text-green-600 mt-1">+12% from last month</p>
            </div>
            <AnimatedIcon
              icon={
                <svg
                  className="w-8 h-8 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              }
              size="lg"
              animationType="pulse"
            />
          </div>
        </AnimatedCard>

        <AnimatedCard
          animationType="glow"
          className={`${selectedCard === 'revenue' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => handleCardClick('revenue')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">$45,678</p>
              <p className="text-xs text-green-600 mt-1">+8% from last month</p>
            </div>
            <AnimatedIcon
              icon={
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
              size="lg"
              animationType="bounce"
            />
          </div>
        </AnimatedCard>

        <AnimatedCard
          animationType="tilt"
          className={`${selectedCard === 'orders' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => handleCardClick('orders')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">1,234</p>
              <p className="text-xs text-red-600 mt-1">-3% from last month</p>
            </div>
            <AnimatedIcon
              icon={
                <svg
                  className="w-8 h-8 text-yellow-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              }
              size="lg"
              animationType="wiggle"
            />
          </div>
        </AnimatedCard>

        <AnimatedCard
          animationType="bounce"
          className={`${selectedCard === 'conversion' ? 'ring-2 ring-purple-500' : ''}`}
          onClick={() => handleCardClick('conversion')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Conversion</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">3.24%</p>
              <p className="text-xs text-green-600 mt-1">+0.5% from last month</p>
            </div>
            <AnimatedIcon
              icon={
                <svg
                  className="w-8 h-8 text-purple-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              }
              size="lg"
              animationType="heartbeat"
            />
          </div>
        </AnimatedCard>
      </div>

      {/* Interactive Form Section */}
      <AnimatedCard animationType="lift" className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <AnimatedInput
              label="Search"
              value=""
              onChange={() => {}}
              placeholder="Search for anything..."
              animationType="focus"
            />

            <div className="flex space-x-3">
              <AnimatedButton
                variant="primary"
                animationType="scale"
                onClick={() => handleAction('Search')}
              >
                Search
              </AnimatedButton>

              <AnimatedButton
                variant="ghost"
                animationType="glow"
                onClick={() => handleAction('Filter')}
              >
                Filter
              </AnimatedButton>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Progress Example
              </label>
              <AnimatedProgressBar
                progress={75}
                color="blue"
                showPercentage={true}
                animated={true}
              />
            </div>

            <div className="flex items-center space-x-3">
              <LoadingSpinner size="sm" color="blue" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Processing...</span>
            </div>
          </div>
        </div>
      </AnimatedCard>

      {/* Toast Notifications */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50">
          <ToastNotification
            message={toastMessage}
            type="info"
            duration={3000}
            onClose={() => setShowToast(false)}
          />
        </div>
      )}
    </div>
  );
};

// =============================================================================
// ANIMATED FORM WITH VALIDATION
// =============================================================================

interface AnimatedFormProps {
  onSubmit: (data: any) => void;
}

export const AnimatedForm: React.FC<AnimatedFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { showLoader } = useLoadingAnimation(isSubmitting);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setShowSuccess(true);

    // Reset form after success
    setTimeout(() => {
      setShowSuccess(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
    }, 3000);

    onSubmit(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <AnimatedCard animationType="bounce" className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white animate-fade-in">
            Create Account
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2 animate-fade-in animation-delay-200">
            Join us with smooth animations
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatedInput
            label="Full Name"
            value={formData.name}
            onChange={(value) => handleInputChange('name', value)}
            placeholder="Enter your full name"
            error={errors.name}
            animationType="focus"
            required
          />

          <AnimatedInput
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(value) => handleInputChange('email', value)}
            placeholder="Enter your email"
            error={errors.email}
            animationType="glow"
            required
          />

          <AnimatedInput
            label="Password"
            type="password"
            value={formData.password}
            onChange={(value) => handleInputChange('password', value)}
            placeholder="Create a password"
            error={errors.password}
            animationType="focus"
            required
          />

          <AnimatedInput
            label="Confirm Password"
            type="password"
            value={formData.confirmPassword}
            onChange={(value) => handleInputChange('confirmPassword', value)}
            placeholder="Confirm your password"
            error={errors.confirmPassword}
            animationType="focus"
            required
          />

          <AnimatedButton
            type="submit"
            variant="primary"
            fullWidth
            animationType="scale"
            disabled={isSubmitting}
            className="mt-6"
          >
            {showLoader && <LoadingSpinner size="sm" color="blue" className="mr-2" />}
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </AnimatedButton>
        </form>

        {showSuccess && (
          <div className="mt-4 text-center">
            <SuccessIndicator size="lg" />
            <p className="text-green-600 font-medium mt-2 animate-fade-in">
              Account created successfully!
            </p>
          </div>
        )}
      </AnimatedCard>
    </div>
  );
};

// =============================================================================
// ANIMATED LIST WITH INTERACTIONS
// =============================================================================

interface AnimatedListProps {
  items: Array<{
    id: string;
    title: string;
    description: string;
    status: 'active' | 'inactive' | 'pending';
  }>;
  onItemClick: (item: any) => void;
  onItemDelete: (itemId: string) => void;
}

export const AnimatedList: React.FC<AnimatedListProps> = ({ items, onItemClick, onItemDelete }) => {
  const [deletingItem, setDeletingItem] = useState<string | null>(null);

  const handleDelete = async (itemId: string) => {
    setDeletingItem(itemId);

    // Simulate delete animation
    await new Promise((resolve) => setTimeout(resolve, 300));

    onItemDelete(itemId);
    setDeletingItem(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <AnimatedCard
          key={item.id}
          animationType="lift"
          className={`p-4 cursor-pointer transition-all duration-200 ${
            deletingItem === item.id ? 'animate-fade-out' : ''
          }`}
          onClick={() => onItemClick(item)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-white">{item.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
            </div>

            <div className="flex items-center space-x-3">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                  item.status
                )}`}
              >
                {item.status}
              </span>

              <AnimatedButton
                variant="ghost"
                size="sm"
                animationType="scale"
                onClick={() => {
                  handleDelete(item.id);
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <AnimatedIcon
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  }
                  size="sm"
                  animationType="wiggle"
                />
              </AnimatedButton>
            </div>
          </div>
        </AnimatedCard>
      ))}
    </div>
  );
};

// =============================================================================
// ANIMATED MODAL EXAMPLE
// =============================================================================

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const AnimatedModal: React.FC<AnimatedModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50 animate-fade-in" onClick={onClose} />

      {/* Modal */}
      <AnimatedCard
        animationType="bounce"
        className="relative max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <AnimatedButton variant="ghost" size="sm" animationType="scale" onClick={onClose}>
            <AnimatedIcon
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              }
              size="sm"
            />
          </AnimatedButton>
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <AnimatedButton variant="ghost" animationType="scale" onClick={onClose}>
            Cancel
          </AnimatedButton>
          <AnimatedButton variant="primary" animationType="bounce" onClick={onClose}>
            Confirm
          </AnimatedButton>
        </div>
      </AnimatedCard>
    </div>
  );
};

// =============================================================================
// EXPORT ALL EXAMPLES
// =============================================================================

export default {
  EnhancedDashboard,
  AnimatedForm,
  AnimatedList,
  AnimatedModal,
};
