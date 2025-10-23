## CCR Downtime Data - Data Format Guide

This guide provides detailed information about the format and structure of CCR Downtime data in the SIPOMA system.

### Database Schema

The `ccr_downtime_data` collection has the following schema:

```typescript
export interface CcrDowntimeData {
  id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  pic: string;
  problem: string;
  unit: string;
  action?: string;
  corrective_action?: string;
  status?: DowntimeStatus;
}
```

### Date and Time Format Validation

Dates should be stored in ISO format (YYYY-MM-DD):

- Good: `2025-10-18`
- Bad: `10/18/2025`, `18-10-2025`

Time values should be in 24-hour HH:MM format:

- Good: `14:30`, `08:15`
- Bad: `2:30 PM`, `8.15`

### Displaying Values

When displaying values in the UI, you can format them as needed for readability, but when saving to the database, ensure they follow the required format.

### Input Validation

Time input components in forms should use `<input type="time">` which automatically enforces the correct format.

Example from our code:

```tsx
<input
  type="time"
  value={formatTimeValue(downtime.start_time)}
  onChange={(e) => {
    const parsed = parseTimeValue(e.target.value);
    handleDowntimeChange(downtime.id, 'start_time', parsed);
  }}
/>
```

### Helper Functions

We use these helper functions to ensure consistent format:

1. `normalizeDateFormat(dateStr)`: Ensures dates are in YYYY-MM-DD format
2. `formatTimeValue(value)`: Formats time values for display in the UI
3. `parseTimeValue(value)`: Parses time values from UI inputs back to database format

### Common Issues

1. **400 Bad Request errors**: Usually occur when sending fields that don't exist in the schema
2. **Missing data**: Can happen if format conversion fails
3. **Inconsistent data**: When time formats vary across records

### Best Practices

1. Always validate and normalize date/time formats before saving
2. Use strong typing (TypeScript) to catch field mismatches
3. When in doubt, check the type definition in `types.ts`
4. Don't add additional date/time fields unless updating the schema
