import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ParameterSettingForm from '../pages/plant_operations/ParameterSettingForm';
import { PlantUnit } from '../types';

describe('ParameterSettingForm with RKC Plant Units', () => {
  const rkcPlantUnits: PlantUnit[] = [
    { id: '1', unit: 'Raw Mill 411', category: 'Tonasa 4' },
    { id: '2', unit: 'Raw Mill 412', category: 'Tonasa 4' },
    { id: '3', unit: 'Kiln 416', category: 'Tonasa 4' },
    { id: '4', unit: 'Raw Mill 532', category: 'Tonasa 5' },
    { id: '5', unit: 'Kiln 543', category: 'Tonasa 5' },
  ];

  const t = {
    parameter_label: 'Parameter Name',
    data_type_label: 'Data Type',
    unit_label_param: 'Unit',
    category_label: 'Category',
    select_unit: 'Select Unit',
    select_category: 'Select Category',
    save: 'Save',
    cancel: 'Cancel',
  };

  it('renders Unit and Category dropdowns populated from provided plantUnits', () => {
    render(
      <ParameterSettingForm
        recordToEdit={null}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        t={t}
        plantUnits={rkcPlantUnits}
        loading={false}
      />
    );

    // Check Unit options
    const unitSelect = screen.getByLabelText(/Unit/i) as HTMLSelectElement;
    const unitOptionTexts = Array.from(unitSelect.options).map((opt) => opt.text);
    expect(unitOptionTexts).toContain('Raw Mill 411');
    expect(unitOptionTexts).toContain('Raw Mill 412');
    expect(unitOptionTexts).toContain('Kiln 416');
    expect(unitOptionTexts).toContain('Raw Mill 532');
    expect(unitOptionTexts).toContain('Kiln 543');
    // Ensure CM units are NOT present
    expect(unitOptionTexts).not.toContain('Cement Mill 220');

    // Check Category options
    const categorySelect = screen.getByLabelText(/Category/i) as HTMLSelectElement;
    const categoryOptionTexts = Array.from(categorySelect.options).map((opt) => opt.text);
    expect(categoryOptionTexts).toContain('Tonasa 4');
    expect(categoryOptionTexts).toContain('Tonasa 5');
    expect(categoryOptionTexts).not.toContain('Tonasa 2/3');
  });

  it('automatically sets Category to Tonasa 4 when Raw Mill 411 is selected', () => {
    render(
      <ParameterSettingForm
        recordToEdit={null}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        t={t}
        plantUnits={rkcPlantUnits}
        loading={false}
      />
    );

    const unitSelect = screen.getByLabelText(/Unit/i) as HTMLSelectElement;
    const categorySelect = screen.getByLabelText(/Category/i) as HTMLSelectElement;

    fireEvent.change(unitSelect, { target: { value: 'Raw Mill 411' } });

    expect(unitSelect.value).toBe('Raw Mill 411');
    expect(categorySelect.value).toBe('Tonasa 4');
  });

  it('filters Unit options when Category is selected first', () => {
    render(
      <ParameterSettingForm
        recordToEdit={null}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        t={t}
        plantUnits={rkcPlantUnits}
        loading={false}
      />
    );

    const categorySelect = screen.getByLabelText(/Category/i) as HTMLSelectElement;
    fireEvent.change(categorySelect, { target: { value: 'Tonasa 5' } });

    const unitSelect = screen.getByLabelText(/Unit/i) as HTMLSelectElement;
    const filteredOptions = Array.from(unitSelect.options)
      .map((opt) => opt.text)
      .filter((text) => text !== 'Select Unit');

    expect(filteredOptions).toEqual(['Raw Mill 532', 'Kiln 543']);
  });
});
