-- Migration: Add plant_category and plant_unit columns to work_instructions table

-- Add plant_category column
ALTER TABLE work_instructions
ADD COLUMN IF NOT EXISTS plant_category VARCHAR(100) NOT NULL DEFAULT '';

-- Add plant_unit column
ALTER TABLE work_instructions
ADD COLUMN IF NOT EXISTS plant_unit VARCHAR(100) NOT NULL DEFAULT '';

-- Add foreign key constraints if needed (assuming plant_units table exists)
-- ALTER TABLE work_instructions
-- ADD CONSTRAINT fk_work_instructions_plant_category
-- FOREIGN KEY (plant_category) REFERENCES plant_units(category);

-- ALTER TABLE work_instructions
-- ADD CONSTRAINT fk_work_instructions_plant_unit
-- FOREIGN KEY (plant_unit) REFERENCES plant_units(unit);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_work_instructions_plant_category ON work_instructions(plant_category);
CREATE INDEX IF NOT EXISTS idx_work_instructions_plant_unit ON work_instructions(plant_unit);