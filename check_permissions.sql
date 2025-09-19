-- Check permissions table for the permission_ids found in user_permissions
-- Run this in Supabase SQL Editor to see what permissions exist

SELECT
    p.id,
    p.module_name,
    p.permission_level,
    p.plant_units,
    COUNT(up.user_id) as users_with_permission
FROM permissions p
LEFT JOIN user_permissions up ON p.id = up.permission_id
GROUP BY p.id, p.module_name, p.permission_level, p.plant_units
ORDER BY p.module_name, p.permission_level;

-- Check specific permission_ids from user_permissions data
SELECT * FROM permissions
WHERE id IN (
    'da936889-cd7a-44a3-8804-534f1a95b014',
    '4428f1f5-8d3a-4297-920d-426c89db8a94',
    'f9f46fd7-45b5-4d70-9039-89d47b00184c',
    'b3e07221-a1b9-4478-aa3c-409f8365e85d',
    '335a20dd-6f68-4aa0-921c-2abd69b5a0ef',
    '3f65647c-a390-432b-b1d3-3082420353ee',
    '8906d5c5-4713-41c4-a4df-2c4a2bbc3606',
    'd8db9ed7-ebdd-4213-90fb-dc800f0211cc',
    '432ab81d-ccab-4061-8fa2-c7b5df8d16d2',
    '3398bb5c-69ac-42fb-b953-67aaaccddabc',
    '4691fe23-e984-4d05-89ee-d2072cb0d940',
    '3c4951c8-eea0-4bb7-9d93-bc0ca5f85a25',
    '38909b0c-1f6a-44f7-88ef-4692daf0a275'
);