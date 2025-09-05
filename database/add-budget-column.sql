-- Add budget column to projects table
ALTER TABLE projects 
ADD COLUMN budget DECIMAL(15,2) DEFAULT 0;

-- Update existing projects with default budget if needed
UPDATE projects SET budget = 0 WHERE budget IS NULL;

-- Add comment to describe the column
COMMENT ON COLUMN projects.budget IS 'Project budget in currency units';
