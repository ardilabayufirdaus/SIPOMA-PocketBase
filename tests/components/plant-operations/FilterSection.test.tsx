import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FilterSection from '../../../components/plant-operations/FilterSection';

// Mock the hooks
jest.mock('../../../hooks/useCurrentUser', () => ({
  useCurrentUser: jest.fn(),
}));

jest.mock('../../../utils/permissions', () => ({
  usePermissions: jest.fn(),
}));

const mockUseCurrentUser = require('../../../hooks/useCurrentUser').useCurrentUser;
const mockUsePermissions = require('../../../utils/permissions').usePermissions;

describe('FilterSection', () => {
  const defaultProps = {
    filters: {
      plantCategory: 'all',
      plantUnit: 'all',
      timeRange: '24h',
      month: 1,
      year: 2024,
    },
    uniqueCategories: ['Cement Mill', 'Packing Plant'],
    availableUnits: ['Cement Mill 1', 'Packing Plant A'],
    onFilterChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders filters when user has plant operations access', () => {
    mockUseCurrentUser.mockReturnValue({
      id: '1',
      username: 'testuser',
      permissions: {
        plant_operations: {
          'Cement Mill': { 'Cement Mill 1': 'READ' },
        },
      },
    });

    mockUsePermissions.mockReturnValue({
      canAccessPlantOperations: jest.fn().mockReturnValue(true),
      hasPlantOperationPermission: jest.fn().mockReturnValue(true),
    });

    render(<FilterSection {...defaultProps} />);
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByLabelText('Plant Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Plant Unit')).toBeInTheDocument();
  });

  it('does not render filters when user has no plant operations access', () => {
    mockUseCurrentUser.mockReturnValue({
      id: '1',
      username: 'testuser',
      permissions: {
        plant_operations: 'NONE',
      },
    });

    mockUsePermissions.mockReturnValue({
      canAccessPlantOperations: jest.fn().mockReturnValue(false),
    });

    const { container } = render(<FilterSection {...defaultProps} />);
    expect(container.firstChild).toBeNull();
  });
});
