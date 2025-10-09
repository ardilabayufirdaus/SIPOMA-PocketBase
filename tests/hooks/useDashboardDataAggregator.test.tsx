import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardDataAggregator } from '../../hooks/useDashboardDataAggregator';

// Mock the individual hooks
const mockUsePlantUnits = jest.fn();
const mockUseSiloCapacities = jest.fn();
const mockUseAutonomousRiskData = jest.fn();
const mockUseWorkInstructions = jest.fn();

jest.mock('../../hooks/usePlantUnits', () => ({
  usePlantUnits: () => mockUsePlantUnits(),
}));

jest.mock('../../hooks/useSiloCapacities', () => ({
  useSiloCapacities: () => mockUseSiloCapacities(),
}));

jest.mock('../../hooks/useAutonomousRiskData', () => ({
  useAutonomousRiskData: () => mockUseAutonomousRiskData(),
}));

jest.mock('../../hooks/useWorkInstructions', () => ({
  useWorkInstructions: () => mockUseWorkInstructions(),
}));

describe('useDashboardDataAggregator', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();

    // Setup mock return values
    mockUsePlantUnits.mockReturnValue({
      records: [{ id: '1', unit: 'Cement Mill 1', category: 'Cement Mill' }],
      loading: false,
    });

    mockUseSiloCapacities.mockReturnValue({
      records: [{ id: '1', plant_category: 'Cement Mill', unit: 'Cement Mill 1', capacity: 1000 }],
      loading: false,
    });

    mockUseAutonomousRiskData.mockReturnValue({
      records: [
        {
          id: '1',
          unit: 'Cement Mill 1',
          potential_disruption: 'High temperature',
          status: 'identified',
          date: '2024-01-01',
        },
      ],
      loading: false,
    });

    mockUseWorkInstructions.mockReturnValue({
      instructions: [{ id: '1', activity: 'Maintenance', plant_category: 'Cement Mill' }],
      loading: false,
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should aggregate data correctly with filters', async () => {
    const mockFilters = {
      plantCategory: 'Cement Mill',
      plantUnit: 'Cement Mill 1',
      timeRange: '24h',
      month: 1,
      year: 2024,
    };

    const mockPlantUnits = [
      { id: '1', unit: 'Cement Mill 1', category: 'Cement Mill' },
      { id: '2', unit: 'Packing Plant A', category: 'Packing Plant' },
    ];

    const mockSiloData = [
      { id: '1', plant_category: 'Cement Mill', unit: 'Cement Mill 1', capacity: 1000 },
    ];

    const mockRiskData = [
      {
        id: '1',
        unit: 'Cement Mill 1',
        potential_disruption: 'High temperature',
        status: 'identified',
        date: '2024-01-01',
      },
    ];

    const mockWorkInstructions = [
      { id: '1', activity: 'Maintenance', plant_category: 'Cement Mill' },
    ];

    // Mock the query functions
    queryClient.setQueryData(['plant-units'], mockPlantUnits);
    queryClient.setQueryData(['silo-capacities'], mockSiloData);
    queryClient.setQueryData(['autonomous-risk-data'], mockRiskData);
    queryClient.setQueryData(['work-instructions'], mockWorkInstructions);

    const { result } = renderHook(() => useDashboardDataAggregator(mockFilters), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stats.totalUnits).toBe(1);
    expect(result.current.stats.totalParameters).toBe(0);
    expect(result.current.filteredData.uniqueCategories).toContain('Cement Mill');
    expect(result.current.filteredData.availableUnits).toContain('Cement Mill 1');
  });
});
