import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FilterSection from '../../../components/plant-operations/FilterSection';
import { User } from '../../../types';

// Mock the hooks
jest.mock('../../../hooks/useCurrentUser', () => ({
  useCurrentUser: jest.fn(),
}));

jest.mock('../../../utils/permissions', () => ({
  usePermissions: jest.fn(),
}));

import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { usePermissions } from '../../../utils/permissions';

const mockUseCurrentUser = useCurrentUser as jest.MockedFunction<typeof useCurrentUser>;
const mockUsePermissions = usePermissions as jest.MockedFunction<typeof usePermissions>;

describe('FilterSection', () => {
  const defaultProps = {
    filters: {
      plantCategory: 'all',
      plantUnit: 'all',
      timeRange: '24h',
      month: 1,
      year: 2024,
    },
    plantUnits: [{ id: '1', unit: 'Cement Mill 1', category: 'Cement Mill', description: '' }],
    onFilterChange: jest.fn(),
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders filters when user has plant operations access', () => {
    mockUseCurrentUser.mockReturnValue({
      currentUser: {
        id: '1',
        username: 'testuser',
        permissions: {
          plant_operations: {
            'Cement Mill': { 'Cement Mill 1': 'READ' },
          },
        },
      } as any,
      loading: false,
      error: null,
      logout: jest.fn(),
    });

    mockUsePermissions.mockReturnValue({
      canAccessPlantOperations: jest.fn().mockReturnValue(true),
      hasPlantOperationPermission: jest.fn().mockReturnValue(true),
    } as any);

    render(<FilterSection {...defaultProps} />);
    expect(screen.getByText('Smart Filters')).toBeInTheDocument();
    expect(screen.getByLabelText('Plant Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Plant Unit')).toBeInTheDocument();
  });

  it('does not render filters when user has no plant operations access', () => {
    mockUseCurrentUser.mockReturnValue({
      currentUser: {
        id: '1',
        username: 'testuser',
        permissions: {
          plant_operations: 'NONE',
        },
      } as any,
      loading: false,
      error: null,
      logout: jest.fn(),
    });

    mockUsePermissions.mockReturnValue({
      canAccessPlantOperations: jest.fn().mockReturnValue(false),
    } as any);

    const { container } = render(<FilterSection {...defaultProps} />);
    expect(container.firstChild).toBeNull();
  });
});
