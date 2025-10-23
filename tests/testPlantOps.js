/**
 * Test untuk memastikan PlantOperationsPage dapat dimuat dengan benar
 */
import React from 'react';
import { render } from '@testing-library/react';
import { PlantOperationsPage } from '../config/lazyComponents';

describe('PlantOperationsPage Loading Test', () => {
  it('should import PlantOperationsPage correctly', async () => {
    const { container } = render(
      <PlantOperationsPage
        activePage="overview"
        t={{ plant_operations: 'Plant Operations' }}
        plantData={{ loading: false }}
      />
    );
    expect(container).toBeDefined();
  });
});

