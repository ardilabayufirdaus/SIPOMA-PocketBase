-- Migration: Add OPC and PCC min/max values to parameter_settings table
-- Date: September 24, 2025
-- Description: Add opc_min_value, opc_max_value, pcc_min_value, pcc_max_value columns to parameter_settings table

-- Add OPC min/max value columns
ALTER TABLE parameter_settings
ADD COLUMN opc_min_value numeric,
ADD COLUMN opc_max_value numeric;

-- Add PCC min/max value columns
ALTER TABLE parameter_settings
ADD COLUMN pcc_min_value numeric,
ADD COLUMN pcc_max_value numeric;

-- Add comments for documentation
COMMENT ON COLUMN parameter_settings.opc_min_value IS 'Minimum value for OPC cement type';
COMMENT ON COLUMN parameter_settings.opc_max_value IS 'Maximum value for OPC cement type';
COMMENT ON COLUMN parameter_settings.pcc_min_value IS 'Minimum value for PCC cement type';
COMMENT ON COLUMN parameter_settings.pcc_max_value IS 'Maximum value for PCC cement type';