/**
 * Responsive Design Implementation Example
 * Demonstrating integration of responsive components with existing SIPOMA components
 */

import React, { useState } from "react";
import {
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveFlex,
  ResponsiveSidebar,
  ResponsiveHeader,
  ResponsiveCardGrid,
  ResponsiveText,
  ResponsiveModal,
  ResponsiveNavigation,
  useResponsiveLayout,
  responsiveUtils,
} from "../utils/ResponsiveLayout";
import {
  EnhancedButton,
  EnhancedCard,
  EnhancedInput,
} from "./EnhancedComponents";

// =============================================================================
// RESPONSIVE DASHBOARD EXAMPLE
// =============================================================================

interface ResponsiveDashboardProps {
  children?: React.ReactNode;
}

export const ResponsiveDashboard: React.FC<ResponsiveDashboardProps> = ({
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isMobile, isTablet, isDesktop } = useResponsiveLayout();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Responsive Sidebar */}
      <ResponsiveSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        width={{ default: "280px", sm: "320px" }}
        className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
      >
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Navigation
          </h2>
          <nav className="space-y-2">
            <a
              href="#"
              className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              Dashboard
            </a>
            <a
              href="#"
              className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              Reports
            </a>
            <a
              href="#"
              className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              Settings
            </a>
          </nav>
        </div>
      </ResponsiveSidebar>

      {/* Main Content */}
      <div className="flex-1">
        {/* Responsive Header */}
        <ResponsiveHeader
          height={{ default: "64px", sm: "72px" }}
          className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-4">
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              )}
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                SIPOMA Dashboard
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <EnhancedButton size={isMobile ? "sm" : "md"}>
                Action
              </EnhancedButton>
            </div>
          </div>
        </ResponsiveHeader>

        {/* Responsive Content */}
        <ResponsiveContainer maxWidth="full" padding="lg" className="py-6">
          <div className="space-y-6">
            {/* Stats Cards */}
            <ResponsiveCardGrid
              minCardWidth={{ default: "280px", sm: "320px", md: "360px" }}
              gap="md"
            >
              <EnhancedCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Users
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      1,234
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-600 dark:text-blue-400"
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
                  </div>
                </div>
              </EnhancedCard>

              <EnhancedCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Active Sessions
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      567
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                </div>
              </EnhancedCard>

              <EnhancedCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      System Health
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      98.5%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                </div>
              </EnhancedCard>
            </ResponsiveCardGrid>

            {/* Main Content Grid */}
            <ResponsiveGrid columns={{ default: 1, md: 2, lg: 3 }} gap="lg">
              <EnhancedCard className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        U
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">
                        User login detected
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        2 minutes ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        S
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">
                        System backup completed
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        1 hour ago
                      </p>
                    </div>
                  </div>
                </div>
              </EnhancedCard>

              <EnhancedCard className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <EnhancedButton variant="primary" fullWidth>
                    Generate Report
                  </EnhancedButton>
                  <EnhancedButton variant="secondary" fullWidth>
                    Export Data
                  </EnhancedButton>
                  <EnhancedButton variant="ghost" fullWidth>
                    View Analytics
                  </EnhancedButton>
                </div>
              </EnhancedCard>

              <EnhancedCard className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  System Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Database
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Online
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      API
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Online
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Cache
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Warning
                    </span>
                  </div>
                </div>
              </EnhancedCard>
            </ResponsiveGrid>
          </div>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// =============================================================================
// RESPONSIVE FORM EXAMPLE
// =============================================================================

interface ResponsiveFormProps {
  onSubmit: (data: any) => void;
  className?: string;
}

export const ResponsiveForm: React.FC<ResponsiveFormProps> = ({
  onSubmit,
  className = "",
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setIsModalOpen(true);
  };

  return (
    <div className={className}>
      <ResponsiveContainer maxWidth="lg" padding="lg">
        <EnhancedCard className="p-6">
          <ResponsiveText
            size={{ default: "xl", sm: "2xl" }}
            weight="bold"
            className="mb-6 text-center"
          >
            Contact Us
          </ResponsiveText>

          <form onSubmit={handleSubmit} className="space-y-6">
            <ResponsiveGrid columns={{ default: 1, md: 2 }} gap="md">
              <EnhancedInput
                label="Name"
                value={formData.name}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, name: value }))
                }
                placeholder="Enter your name"
                required
              />

              <EnhancedInput
                label="Email"
                type="email"
                value={formData.email}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, email: value }))
                }
                placeholder="Enter your email"
                required
              />
            </ResponsiveGrid>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, message: e.target.value }))
                }
                placeholder="Enter your message"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required
              />
            </div>

            <ResponsiveFlex justify="center" className="pt-4">
              <EnhancedButton type="submit" size="lg" className="px-8">
                Send Message
              </EnhancedButton>
            </ResponsiveFlex>
          </form>
        </EnhancedCard>
      </ResponsiveContainer>

      {/* Success Modal */}
      <ResponsiveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size={{ default: "md", sm: "full" }}
      >
        <div className="p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Message Sent!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Thank you for contacting us. We'll get back to you soon.
            </p>
            <EnhancedButton onClick={() => setIsModalOpen(false)}>
              Close
            </EnhancedButton>
          </div>
        </div>
      </ResponsiveModal>
    </div>
  );
};

// =============================================================================
// RESPONSIVE NAVIGATION EXAMPLE
// =============================================================================

interface ResponsiveNavigationExampleProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const ResponsiveNavigationExample: React.FC<
  ResponsiveNavigationExampleProps
> = ({ currentPage, onNavigate }) => {
  const { isMobile } = useResponsiveLayout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "home", label: "Home" },
    { id: "about", label: "About" },
    { id: "services", label: "Services" },
    { id: "contact", label: "Contact" },
  ];

  return (
    <ResponsiveHeader
      height={{ default: "64px", sm: "72px" }}
      className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between w-full">
        {/* Logo */}
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            SIPOMA
          </h1>
        </div>

        {/* Desktop Navigation */}
        {!isMobile && (
          <ResponsiveNavigation className="flex-1 mx-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === item.id
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </ResponsiveNavigation>
        )}

        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}

        {/* User Actions */}
        <div className="flex items-center space-x-4">
          <EnhancedButton size="sm">Sign In</EnhancedButton>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobile && mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="px-4 py-2 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  currentPage === item.id
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </ResponsiveHeader>
  );
};

// =============================================================================
// EXPORT ALL EXAMPLES
// =============================================================================

export default {
  ResponsiveDashboard,
  ResponsiveForm,
  ResponsiveNavigationExample,
};
