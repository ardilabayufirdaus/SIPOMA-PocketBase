-- Create work_instructions table

CREATE TABLE IF NOT EXISTS work_instructions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity VARCHAR(255) NOT NULL,
    doc_code VARCHAR(100) NOT NULL,
    doc_title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    link VARCHAR(500) NOT NULL,
    plant_category VARCHAR(100) NOT NULL,
    plant_unit VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_work_instructions_activity ON work_instructions(activity);
CREATE INDEX IF NOT EXISTS idx_work_instructions_doc_code ON work_instructions(doc_code);
CREATE INDEX IF NOT EXISTS idx_work_instructions_plant_category ON work_instructions(plant_category);
CREATE INDEX IF NOT EXISTS idx_work_instructions_plant_unit ON work_instructions(plant_unit);