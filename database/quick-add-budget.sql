-- Run this SQL in Supabase SQL Editor to add budget column

ALTER TABLE projects ADD COLUMN budget BIGINT DEFAULT 0;
