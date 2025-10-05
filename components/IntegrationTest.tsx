/**
 * Integration Test Component
 * Demonstrates seamless integration between new enhanced components and existing SIPOMA components
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

// Import existing SIPOMA components for comparison
// ModernButton replaced with EnhancedButton for testing

export const IntegrationTest: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'enhanced' | 'modern'>('enhanced');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    feedback: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const { announceToScreenReader } = useAccessibility();
  const isHighContrast = useHighContrast();
  const prefersReducedMotion = useReducedMotion();
  const colorScheme = useColorScheme();

  const handleTabChange = (tab: 'enhanced' | 'modern') => {
    setActiveTab(tab);
    announceToScreenReader(`Switched to ${tab} components`, 'polite');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsLoading(false);
    announceToScreenReader('Form submitted successfully!', 'assertive');
  };

  const tabs = [
    { id: 'enhanced', label: 'Enhanced Components', component: 'enhanced' },
    { id: 'modern', label: 'Modern Components', component: 'modern' },
  ];

  const { focusedIndex, isFocused } = useEnhancedKeyboardNavigation(tabs, (tab) => {
    handleTabChange(tab.component as 'enhanced' | 'modern');
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Skip Links */}
      <SkipLinks />

      {/* Screen Reader Status */}
      <ScreenReaderAnnouncement
        message={`Integration test loaded. Theme: ${colorScheme}, High contrast: ${
          isHighContrast ? 'enabled' : 'disabled'
        }`}
        priority="polite"
      />

      <main id="main-content">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
            Component Integration Test
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            This page demonstrates the seamless integration between our new enhanced components and
            existing SIPOMA components, showcasing backward compatibility and migration paths.
          </p>
        </div>

        {/* Tab Navigation */}
        <section aria-labelledby="tab-section" className="mb-8">
          <h2 id="tab-section" className="text-2xl font-semibold mb-6 text-center">
            Component Comparison
          </h2>

          <div className="flex justify-center mb-8">
            <div
              role="tablist"
              aria-label="Component comparison tabs"
              className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1"
            >
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.component}
                  aria-controls={`${tab.id}-panel`}
                  tabIndex={isFocused(index) ? 0 : -1}
                  onClick={() => handleTabChange(tab.component as 'enhanced' | 'modern')}
                  className={cn(
                    'px-6 py-3 rounded-md font-medium transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                    activeTab === tab.component
                      ? 'bg-white dark:bg-neutral-700 text-primary-600 shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Panels */}
          <div className="space-y-8">
            {/* Enhanced Components Panel */}
            <div
              id="enhanced-panel"
              role="tabpanel"
              aria-labelledby="enhanced-tab"
              hidden={activeTab !== 'enhanced'}
              className={activeTab === 'enhanced' ? 'block' : 'hidden'}
            >
              <div className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl p-8">
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
                  ✨ Enhanced Components (New)
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                  Our latest components with WCAG 2.1 AA compliance, advanced accessibility
                  features, and modern design patterns.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Form Example */}
                  <EnhancedCard className="p-6">
                    <h4 className="text-lg font-semibold mb-4">Contact Form</h4>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <EnhancedInput
                        label="Full Name"
                        value={formData.name}
                        onChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
                        placeholder="Enter your name"
                        required
                      />

                      <EnhancedInput
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(value) => setFormData((prev) => ({ ...prev, email: value }))}
                        placeholder="Enter your email"
                        required
                      />

                      <div>
                        <label className="block text-sm font-medium mb-2">Feedback</label>
                        <textarea
                          value={formData.feedback}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              feedback: e.target.value,
                            }))
                          }
                          placeholder="Share your feedback..."
                          className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-3">
                        <EnhancedButton
                          type="submit"
                          variant="primary"
                          loading={isLoading}
                          className="flex-1"
                        >
                          {isLoading ? 'Submitting...' : 'Submit'}
                        </EnhancedButton>

                        <EnhancedButton
                          type="button"
                          variant="ghost"
                          onClick={() => setFormData({ name: '', email: '', feedback: '' })}
                        >
                          Clear
                        </EnhancedButton>
                      </div>
                    </form>
                  </EnhancedCard>

                  {/* Interactive Elements */}
                  <div className="space-y-6">
                    <EnhancedCard className="p-6">
                      <h4 className="text-lg font-semibold mb-4">Interactive Elements</h4>
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <AccessibleTooltip content="Primary action tooltip" position="top">
                            <EnhancedButton variant="primary" size="sm">
                              Primary
                            </EnhancedButton>
                          </AccessibleTooltip>

                          <AccessibleTooltip content="Secondary action tooltip" position="bottom">
                            <EnhancedButton variant="secondary" size="sm">
                              Secondary
                            </EnhancedButton>
                          </AccessibleTooltip>
                        </div>

                        <ProgressIndicator
                          value={75}
                          max={100}
                          label="Task completion"
                          showPercentage
                          variant="success"
                        />
                      </div>
                    </EnhancedCard>

                    <EnhancedCard className="p-6">
                      <h4 className="text-lg font-semibold mb-4">Disclosure Component</h4>
                      <Disclosure
                        id="integration-faq"
                        isOpen={false}
                        onToggle={() => {}}
                        trigger="What are the benefits of enhanced components?"
                      >
                        <div className="space-y-2 text-sm">
                          <p>• WCAG 2.1 AA compliance out of the box</p>
                          <p>• Advanced accessibility features</p>
                          <p>• Better keyboard navigation</p>
                          <p>• Screen reader support</p>
                          <p>• Modern design patterns</p>
                        </div>
                      </Disclosure>
                    </EnhancedCard>
                  </div>
                </div>
              </div>
            </div>

            {/* Modern Components Panel */}
            <div
              id="modern-panel"
              role="tabpanel"
              aria-labelledby="modern-tab"
              hidden={activeTab !== 'modern'}
              className={activeTab === 'modern' ? 'block' : 'hidden'}
            >
              <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 rounded-xl p-8">
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
                  🔄 Modern Components (Existing)
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                  Your existing SIPOMA components that have been working reliably. These remain
                  fully functional and compatible.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Form Example with Modern Components */}
                  <EnhancedCard className="p-6">
                    <h4 className="text-lg font-semibold mb-4">Contact Form (Modern Style)</h4>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Full Name</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          placeholder="Enter your name"
                          className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          placeholder="Enter your email"
                          className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Feedback</label>
                        <textarea
                          value={formData.feedback}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              feedback: e.target.value,
                            }))
                          }
                          placeholder="Share your feedback..."
                          className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-3">
                        <EnhancedButton variant="primary" className="flex-1" disabled={isLoading}>
                          {isLoading ? 'Submitting...' : 'Submit'}
                        </EnhancedButton>

                        <EnhancedButton
                          variant="ghost"
                          onClick={() => setFormData({ name: '', email: '', feedback: '' })}
                        >
                          Clear
                        </EnhancedButton>
                      </div>
                    </form>
                  </EnhancedCard>

                  {/* Feature Comparison */}
                  <EnhancedCard className="p-6">
                    <h4 className="text-lg font-semibold mb-4">Feature Comparison</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                        <span className="text-sm">WCAG 2.1 AA Compliance</span>
                        <div className="flex gap-2">
                          <span className="text-green-600 text-sm">✓ Enhanced</span>
                          <span className="text-yellow-600 text-sm">○ Modern</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                        <span className="text-sm">Screen Reader Support</span>
                        <div className="flex gap-2">
                          <span className="text-green-600 text-sm">✓ Enhanced</span>
                          <span className="text-neutral-400 text-sm">○ Modern</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                        <span className="text-sm">Keyboard Navigation</span>
                        <div className="flex gap-2">
                          <span className="text-green-600 text-sm">✓ Enhanced</span>
                          <span className="text-neutral-400 text-sm">○ Modern</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                        <span className="text-sm">Microinteractions</span>
                        <div className="flex gap-2">
                          <span className="text-green-600 text-sm">✓ Enhanced</span>
                          <span className="text-neutral-400 text-sm">○ Modern</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm">Backward Compatibility</span>
                        <div className="flex gap-2">
                          <span className="text-green-600 text-sm">✓ Both</span>
                          <span className="text-green-600 text-sm">✓ Both</span>
                        </div>
                      </div>
                    </div>
                  </EnhancedCard>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Migration Guide */}
        <section aria-labelledby="migration-section" className="mt-12">
          <EnhancedCard className="p-8 bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
            <h2 id="migration-section" className="text-2xl font-bold mb-4">
              🚀 Migration Guide
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Phase 1: Gradual Adoption</h3>
                <p className="text-sm opacity-90">
                  Start using enhanced components in new features while keeping existing components
                  functional.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Phase 2: Component Updates</h3>
                <p className="text-sm opacity-90">
                  Gradually replace existing components with enhanced versions, testing thoroughly
                  at each step.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Phase 3: Full Migration</h3>
                <p className="text-sm opacity-90">
                  Complete migration with comprehensive testing and accessibility validation.
                </p>
              </div>
            </div>
          </EnhancedCard>
        </section>
      </main>
    </div>
  );
};

// Utility function for className concatenation
const cn = (...classes: (string | undefined | null | boolean)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export default IntegrationTest;
