# TODO: Fix Edit User Role Save Bug

## Status: In Progress

### Completed Tasks

- [x] Fix UserForm.tsx - Ensure permissions are always included when submitting edited user
- [x] Fix useUsers.ts - Add comprehensive logging and error handling for updateUser
- [x] Fix App.tsx - Add error handling in handleSaveUser with proper error messages

### Remaining Tasks

- [ ] Test edit user role flow
  - Open user management page
  - Click edit on a user
  - Change user role (e.g., from Operator to Manager)
  - Verify permissions auto-update
  - Click Save
  - Check if user role is saved successfully
  - Verify permissions are updated in database
- [ ] Verify permissions sync with role changes
  - Check if permissions matrix updates correctly when role changes
  - Test different role transitions (Operator -> Manager, Manager -> Supervisor, etc.)
- [ ] Test error scenarios
  - Test with invalid data
  - Test network errors
  - Verify error messages are displayed correctly

### Technical Details

- **Root Cause**: Permissions were not being explicitly included in the update payload
- **Fix Applied**:
  - UserForm.tsx: Explicitly include permissions in submit payload
  - useUsers.ts: Added detailed logging and error handling
  - App.tsx: Added try-catch with user-friendly error messages
- **Files Modified**:
  - components/UserForm.tsx
  - hooks/useUsers.ts
  - App.tsx

### Testing Notes

- Monitor browser console for detailed logging during user update
- Check database to verify role and permissions are updated correctly
- Test with different user roles and permission combinations
