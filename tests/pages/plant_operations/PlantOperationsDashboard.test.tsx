import React from 'react';import React from 'react';import React from 'react';

import { render, screen } from '@testing-library/react';

import '@testing-library/jest-dom';import { render, screen } from '@testing-library/react';import { render, screen } from '@testing-library/react';

import PlantOperationsDashboard from '../../../pages/plant_operations/PlantOperationsDashboard';

import '@testing-library/jest-dom';import '@testing-library/jest-dom';

interface TranslationFunction {

  [key: string]: string;import PlantOperationsDashboard from '../../../pages/plant_operations/PlantOperationsDashboard';import PlantOperationsDashboard from '../../../pages/plant_operations/PlantOperationsDashboard';

}



// Mock the hooks

jest.mock('../../../hooks/useDashboardDataAggregator', () => ({interface TranslationFunction {interface TranslationFunction {

  useDashboardDataAggregator: jest.fn(() => ({

    data: {  [key: string]: string;  [key: string]: string;

      ccrData: [],

      siloCapacities: [],}}

      riskData: [],

      workInstructions: [],

    },

    stats: {// Mock the hooks// Mock the hooks

      totalUnits: 5,

      totalParameters: 10,jest.mock('../../../hooks/useDashboardDataAggregator', () => ({jest.mock('../../../hooks/useDashboardDataAggregator', () => ({

      todaysCcrEntries: 2,

    },  useDashboardDataAggregator: jest.fn(() => ({  useDashboardDataAggregator: jest.fn(() => ({

    filteredData: {

      uniqueCategories: ['Cement Mill', 'Packing Plant'],    data: {    data: {

      availableUnits: ['Cement Mill 1', 'Packing Plant A'],

    },      ccrData: [],      ccrData: [],

    isLoading: false,

  })),      siloCapacities: [],      siloCapacities: [],

}));

      riskData: [],      riskData: [],

jest.mock('../../../hooks/useCurrentUser', () => ({

  useCurrentUser: jest.fn(() => ({      workInstructions: [],      workInstructions: [],

    id: '1',

    username: 'testuser',    },    },

    role: 'User',

    permissions: {    stats: {    stats: {

      plant_operations: {

        'Cement Mill': {      totalUnits: 5,      totalUnits: 5,

          'Cement Mill 1': 'READ',

        },      totalParameters: 10,      totalParameters: 10,

        'Packing Plant': {

          'Packing Plant A': 'WRITE',      todaysCcrEntries: 2,      todaysCcrEntries: 2,

        },

      },    },    },

    },

  })),    filteredData: {    filteredData: {

}));

      uniqueCategories: ['Cement Mill', 'Packing Plant'],      uniqueCategories: ['Cement Mill', 'Packing Plant'],

const mockT = ((key: string) => key) as unknown as TranslationFunction;

      availableUnits: ['Cement Mill 1', 'Packing Plant A'],      availableUnits: ['Cement Mill 1', 'Packing Plant A'],

describe('PlantOperationsDashboard', () => {

  beforeEach(() => {    },    },

    jest.clearAllMocks();

  });    isLoading: false,    isLoading: false,



  it('renders dashboard title', () => {  })),  })),

    render(<PlantOperationsDashboard t={mockT} />);

    expect(screen.getByText('Plant Operations Dashboard')).toBeInTheDocument();}));}));

  });



  it('renders filter controls when user has permissions', () => {

    render(<PlantOperationsDashboard t={mockT} />);jest.mock('../../../hooks/useCurrentUser', () => ({jest.mock('../../../hooks/useCurrentUser', () => ({

    expect(screen.getByText('Filters')).toBeInTheDocument();

  });  useCurrentUser: jest.fn(() => ({  useCurrentUser: jest.fn(() => ({

});
    id: '1',    id: '1',

    username: 'testuser',    username: 'testuser',

    role: 'User',    role: 'User',

    permissions: {    permissions: {

      plant_operations: {      plant_operations: {

        'Cement Mill': {        'Cement Mill': {

          'Cement Mill 1': 'READ',          'Cement Mill 1': 'READ',

        },        },

        'Packing Plant': {        'Packing Plant': {

          'Packing Plant A': 'WRITE',          'Packing Plant A': 'WRITE',

        },        },

      },      },

    },    },

  })),  })),

}));}));



const mockT = ((key: string) => key) as unknown as TranslationFunction;const mockT = ((key: string) => key) as unknown as TranslationFunction;



describe('PlantOperationsDashboard', () => {describe('PlantOperationsDashboard', () => {

  beforeEach(() => {  beforeEach(() => {

    jest.clearAllMocks();    jest.clearAllMocks();

  });  });



  it('renders dashboard title', () => {  it('renders dashboard title', () => {

    render(<PlantOperationsDashboard t={mockT} />);    render(<PlantOperationsDashboard t={mockT} />);

    expect(screen.getByText('Plant Operations Dashboard')).toBeInTheDocument();    expect(screen.getByText('Plant Operations Dashboard')).toBeInTheDocument();

  });  });



  it('renders filter controls when user has permissions', () => {  it('renders filter controls', () => {

    render(<PlantOperationsDashboard t={mockT} />);    render(<PlantOperationsDashboard t={mockT} />);

    expect(screen.getByText('Filters')).toBeInTheDocument();    expect(screen.getByText('Filters')).toBeInTheDocument();

  });  });

});});
}));

const mockT = ((key: string) => key) as unknown as TranslationFunction;

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
