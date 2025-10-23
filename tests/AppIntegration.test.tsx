// Test untuk menguji integrasi lazy loading dalam App.tsx dan PermissionGuard

import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import App from '../App';
import { useCurrentUser } from '../hooks/useCurrentUser';

// Mock the hooks
jest.mock('../hooks/useCurrentUser');
jest.mock('../stores/userStore', () => ({
  useUserStore: () => ({
    users: [],
    isLoading: false,
    error: null,
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  }),
}));
jest.mock('../hooks/usePlantData', () => ({
  usePlantData: () => ({ loading: false, plantData: [] }),
}));
jest.mock('../hooks/usePlantUnits', () => ({
  usePlantUnits: () => ({ loading: false, plantUnits: [] }),
}));
jest.mock('../hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}));
jest.mock('../hooks/useTranslation', () => ({
  useTranslation: () => ({
    language: 'en',
    setLanguage: jest.fn(),
    t: (key: string) => key,
  }),
}));
jest.mock('../utils/systemStatus', () => ({
  logSystemStatus: jest.fn(),
}));
jest.mock('../utils/connectionMonitor', () => ({
  startBackgroundHealthCheck: jest.fn(),
}));

describe('App Integration with Lazy Loading', () => {
  beforeEach(() => {
    // Mock currentUser with proper permissions
    (useCurrentUser as jest.Mock).mockImplementation(() => ({
      currentUser: {
        id: 'user-id',
        username: 'test-user',
        full_name: 'Test User',
        email: 'test@example.com',
        role: 'Guest',
        is_active: true,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
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
    }));

    // User store is already mocked in the jest.mock() setup
  });

  test('App renders without crashing', () => {
    // Temporarily suppress error messages during testing
    const originalError = console.error;
    console.error = jest.fn();

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Restore console.error
    console.error = originalError;
  });
});

