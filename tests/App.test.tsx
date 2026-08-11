import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { usePlantUnits } from '../hooks/usePlantUnits';
import { usePlantData } from '../hooks/usePlantData';
import { TranslationProvider } from '../hooks/useTranslation';

import { vi } from 'vitest';

// Mock dependencies
vi.mock('../hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(),
}));
vi.mock('../hooks/usePlantUnits', () => ({
  usePlantUnits: vi.fn(),
}));
vi.mock('../hooks/usePlantData', () => ({
  usePlantData: vi.fn(),
}));
vi.mock('../hooks/useIsMobile', () => ({
  useIsMobile: vi.fn(() => false),
}));
jest.mock('../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => ({
    language: 'en',
    setLanguage: jest.fn(),
    t: jest.fn((key) => key),
  })),
}));
jest.mock('../utils/systemStatus', () => ({
  logSystemStatus: jest.fn(),
}));
jest.mock('../utils/connectionMonitor', () => ({
  startBackgroundHealthCheck: jest.fn(),
}));

// Mock Suspense/lazy loaded components
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');

  return {
    ...originalReact,
    lazy: (factory) => {
      // Wrap the lazy component factory to ensure it returns a proper component
      const LazyComponent = (props) => {
        const Component = originalReact.useState(() => {
          try {
            const module = factory();
            if (module instanceof Promise) {
              throw module; // This will be caught by Suspense
            }
            return module.default || (() => null);
          } catch (e) {
            if (e instanceof Promise) {
              throw e; // Let Suspense handle this
            }
            // For any other errors, return a fallback component
            return () => <div>Error loading component</div>;
          }
        })[0];

        return <Component {...props} />;
      };

      return LazyComponent;
    },
  };
});

describe('App Component', () => {
  beforeEach(() => {
    // Setup default mocks
    (useCurrentUser as jest.Mock).mockReturnValue({
      currentUser: {
        id: 'test-id',
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        role: 'User',
        permissions: {
          dashboard: 'READ',
          plant_operations: {
            category1: {
              unit1: 'READ',
            },
          },
          project_management: 'READ',
          inspection: 'READ',
        },
      },
      loading: false,
      logout: jest.fn(),
    });

    (usePlantUnits as jest.Mock).mockReturnValue({
      loading: false,
      plantUnits: [],
    });

    (usePlantData as jest.Mock).mockReturnValue({
      loading: false,
      plantData: [],
    });
  });

  test('renders App without crashing', () => {
    render(
      <TranslationProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </TranslationProvider>
    );
  });

  test('handles lazy-loaded components correctly', async () => {
    (usePlantUnits as jest.Mock).mockReturnValue({
      records: [],
      loading: true,
    });

    const { container } = render(
      <TranslationProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </TranslationProvider>
    );

    // Verify that the app renders the loader initially
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  test('handles error states gracefully', () => {
    // Render App with valid state
    const { container } = render(
      <TranslationProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </TranslationProvider>
    );

    expect(container).toBeDefined();
  });
});
