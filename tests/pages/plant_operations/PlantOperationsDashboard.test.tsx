import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlantOperationsDashboard from './PlantOperationsDashboard';

// Mock the hooks
jest.mock('../../../hooks/useDashboardDataAggregator', () => ({
  useDashboardDataAggregator: jest.fn(() => ({
    ccrData: [],
    siloData: [],
    riskData: [],
    workInstructions: [],
    isLoading: false,
    error: null,
  })),
  usePlantUnits: jest.fn(() => ({
    data: [
      { id: '1', unit: 'Cement Mill 1', category: 'Cement Mill' },
      { id: '2', unit: 'Packing Plant A', category: 'Packing Plant' },
    ],
    isLoading: false,
    error: null,
  })),
}));

const mockT = jest.fn((key: string) => key);

describe('PlantOperationsDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard title', () => {
    render(<PlantOperationsDashboard t={mockT} />);
    expect(screen.getByText('Plant Operations Dashboard')).toBeInTheDocument();
  });

  it('renders filter controls', () => {
    render(<PlantOperationsDashboard t={mockT} />);
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByLabelText('Plant Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Plant Unit')).toBeInTheDocument();
    expect(screen.getByLabelText('Month')).toBeInTheDocument();
    expect(screen.getByLabelText('Year')).toBeInTheDocument();
  });

  it('renders metric cards', () => {
    render(<PlantOperationsDashboard t={mockT} />);
    expect(screen.getByText('Total Parameters')).toBeInTheDocument();
    expect(screen.getByText('Active Risks')).toBeInTheDocument();
    expect(screen.getByText('Silo Utilization')).toBeInTheDocument();
    expect(screen.getByText('Work Instructions')).toBeInTheDocument();
  });

  it('renders chart containers', () => {
    render(<PlantOperationsDashboard t={mockT} />);
    expect(screen.getByText('CCR Parameter Trends')).toBeInTheDocument();
    expect(screen.getByText('Silo Utilization')).toBeInTheDocument();
    expect(screen.getByText('Risk Distribution')).toBeInTheDocument();
    expect(screen.getByText('Work Instructions Usage')).toBeInTheDocument();
  });

  it('updates filters when select values change', async () => {
    render(<PlantOperationsDashboard t={mockT} />);

    const categorySelect = screen.getByLabelText('Plant Category');
    fireEvent.change(categorySelect, { target: { value: 'Cement Mill' } });

    await waitFor(() => {
      expect(categorySelect).toHaveValue('Cement Mill');
    });
  });
});
