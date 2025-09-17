/**
 * Accessibility Examples Component
 * Demonstrates WCAG 2.1 AA compliant components and patterns
 */

import React, { useState } from 'react';
import {
  EnhancedButton,
  EnhancedInput,
  EnhancedCard,
  SkipLinks,
  Disclosure,
  ProgressIndicator,
  AccessibleTooltip,
  ScreenReaderAnnouncement,
  useAccessibility,
  useEnhancedKeyboardNavigation,
  useHighContrast,
  useReducedMotion,
  useColorScheme,
} from './ui/EnhancedComponents';

export const AccessibilityExamples: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDisclosureOpen, setIsDisclosureOpen] = useState(false);

  const { announceToScreenReader } = useAccessibility();
  const isHighContrast = useHighContrast();
  const prefersReducedMotion = useReducedMotion();
  const colorScheme = useColorScheme();

  // Enhanced keyboard navigation for menu items
  const menuItems = [
    { id: 'home', label: 'Home', href: '#home' },
    { id: 'about', label: 'About', href: '#about' },
    { id: 'services', label: 'Services', href: '#services' },
    { id: 'contact', label: 'Contact', href: '#contact' },
  ];

  const { focusedIndex, selectedIndex, isFocused, isSelected } = useEnhancedKeyboardNavigation(
    menuItems,
    (item) => {
      announceToScreenReader(`Navigated to ${item.label}`, 'polite');
    }
  );

  const handleInputChange = (field: string) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      announceToScreenReader('Please correct the errors in the form', 'assertive');
      return;
    }

    setIsSubmitting(true);
    setProgress(0);

    // Simulate form submission with progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSubmitting(false);
          announceToScreenReader('Form submitted successfully!', 'assertive');
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Skip Links */}
      <SkipLinks />

      {/* Screen Reader Status */}
      <ScreenReaderAnnouncement
        message={`Current theme: ${colorScheme}, High contrast: ${
          isHighContrast ? 'enabled' : 'disabled'
        }, Reduced motion: ${prefersReducedMotion ? 'enabled' : 'disabled'}`}
        priority="polite"
      />

      {/* Main Content */}
      <main id="main-content">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-8">
          Accessibility Examples
        </h1>

        {/* Navigation Menu with Keyboard Support */}
        <section aria-labelledby="nav-heading" className="mb-8">
          <h2 id="nav-heading" className="text-xl font-semibold mb-4">
            Navigation Menu
          </h2>
          <nav role="navigation" aria-label="Main navigation">
            <ul className="flex flex-wrap gap-4" role="menubar">
              {menuItems.map((item, index) => (
                <li key={item.id} role="none">
                  <a
                    href={item.href}
                    role="menuitem"
                    tabIndex={isFocused(index) ? 0 : -1}
                    aria-current={isSelected(index) ? 'page' : undefined}
                    className={cn(
                      'px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500',
                      isFocused(index) && 'bg-primary-100 text-primary-700',
                      isSelected(index) && 'bg-primary-600 text-white'
                    )}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </section>

        {/* Progress Indicator */}
        {isSubmitting && (
          <section aria-labelledby="progress-heading" className="mb-8">
            <h2 id="progress-heading" className="text-xl font-semibold mb-4">
              Submission Progress
            </h2>
            <ProgressIndicator
              value={progress}
              max={100}
              label="Form submission progress"
              showPercentage={true}
              variant="success"
            />
          </section>
        )}

        {/* Accessible Form */}
        <section aria-labelledby="form-heading" className="mb-8">
          <h2 id="form-heading" className="text-xl font-semibold mb-4">
            Contact Form
          </h2>

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <EnhancedInput
                label="Full Name"
                value={formData.name}
                onChange={handleInputChange('name')}
                placeholder="Enter your full name"
                required={true}
                error={errors.name}
                ariaLabel="Enter your full name"
                ariaDescribedBy={errors.name ? 'name-error' : 'name-helper'}
              />

              <EnhancedInput
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                placeholder="Enter your email address"
                required={true}
                error={errors.email}
                ariaLabel="Enter your email address"
                ariaDescribedBy={errors.email ? 'email-error' : 'email-helper'}
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
              >
                Message
                <span className="text-error-500 ml-1" aria-label="required">
                  *
                </span>
              </label>
              <textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleInputChange('message')(e.target.value)}
                placeholder="Enter your message"
                required
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? 'message-error' : 'message-helper'}
                className={cn(
                  'w-full px-4 py-3 border rounded-md transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                  errors.message &&
                    'border-error-500 focus:border-error-500 focus:ring-error-500/20',
                  'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white'
                )}
                rows={4}
              />
              {errors.message && (
                <p
                  id="message-error"
                  role="alert"
                  className="mt-1 text-sm text-error-600 dark:text-error-400"
                >
                  {errors.message}
                </p>
              )}
              <p
                id="message-helper"
                className="mt-1 text-sm text-neutral-500 dark:text-neutral-400"
              >
                Please provide details about your inquiry
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <EnhancedButton
                type="submit"
                variant="primary"
                size="lg"
                loading={isSubmitting}
                loadingText="Submitting form..."
                ariaLabel="Submit contact form"
                className="flex-1"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Form'}
              </EnhancedButton>

              <EnhancedButton
                type="button"
                variant="outline"
                size="lg"
                onClick={() => {
                  setFormData({ name: '', email: '', message: '' });
                  setErrors({});
                  announceToScreenReader('Form cleared', 'polite');
                }}
                ariaLabel="Clear form"
              >
                Clear Form
              </EnhancedButton>
            </div>
          </form>
        </section>

        {/* Disclosure Component */}
        <section aria-labelledby="disclosure-heading" className="mb-8">
          <h2 id="disclosure-heading" className="text-xl font-semibold mb-4">
            Expandable Content
          </h2>

          <Disclosure
            id="faq-1"
            isOpen={isDisclosureOpen}
            onToggle={() => setIsDisclosureOpen(!isDisclosureOpen)}
            trigger={
              <span className="font-medium">
                What accessibility features are included?
                <span className="sr-only">
                  {isDisclosureOpen ? ' Click to collapse' : ' Click to expand'}
                </span>
              </span>
            }
          >
            <div className="prose dark:prose-invert max-w-none">
              <p>This component includes several accessibility features:</p>
              <ul>
                <li>ARIA expanded state management</li>
                <li>Proper heading structure</li>
                <li>Screen reader announcements</li>
                <li>Keyboard navigation support</li>
                <li>Focus management</li>
              </ul>
            </div>
          </Disclosure>
        </section>

        {/* Accessible Tooltips */}
        <section aria-labelledby="tooltips-heading" className="mb-8">
          <h2 id="tooltips-heading" className="text-xl font-semibold mb-4">
            Interactive Elements with Tooltips
          </h2>

          <div className="flex flex-wrap gap-4">
            <AccessibleTooltip content="This is a primary action button" position="top">
              <EnhancedButton variant="primary">Primary Action</EnhancedButton>
            </AccessibleTooltip>

            <AccessibleTooltip content="This button performs a secondary action" position="bottom">
              <EnhancedButton variant="secondary">Secondary Action</EnhancedButton>
            </AccessibleTooltip>

            <AccessibleTooltip content="Warning: This action cannot be undone" position="right">
              <EnhancedButton variant="warning">Warning Action</EnhancedButton>
            </AccessibleTooltip>
          </div>
        </section>

        {/* Status Cards */}
        <section aria-labelledby="status-heading">
          <h2 id="status-heading" className="text-xl font-semibold mb-4">
            Status Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <EnhancedCard className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-success-500 rounded-full" aria-hidden="true"></div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white">System Status</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    All systems operational
                  </p>
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-warning-500 rounded-full" aria-hidden="true"></div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white">Maintenance</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Scheduled for tonight
                  </p>
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-error-500 rounded-full" aria-hidden="true"></div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white">Alert</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Check system logs
                  </p>
                </div>
              </div>
            </EnhancedCard>
          </div>
        </section>
      </main>
    </div>
  );
};

// Utility function for className concatenation
const cn = (...classes: (string | undefined | null | boolean)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export default AccessibilityExamples;
