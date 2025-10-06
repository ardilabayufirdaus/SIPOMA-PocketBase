-- Create ccr_information table for storing additional information in CCR Data Entry
CREATE TABLE IF NOT EXISTS public.ccr_information (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    plant_unit VARCHAR(50) NOT NULL,
    information TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(date, plant_unit)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_ccr_information_date_unit ON public.ccr_information(date, plant_unit);

-- Disable Row Level Security (RLS) for this table
ALTER TABLE public.ccr_information DISABLE ROW LEVEL SECURITY;

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ccr_information_updated_at
    BEFORE UPDATE ON public.ccr_information
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();