# Time Format Fix for CCR Downtime Data

This document outlines how time fields are handled in the CCR Downtime Data system.

## Field Definitions

The CCR downtime data collection has these time-related fields:

- `date` - The date in YYYY-MM-DD format
- `start_time` - The start time in HH:MM format
- `end_time` - The end time in HH:MM format

## Time Format Handling

Based on our code inspection:

1. `start_time` and `end_time` in the database schema are strings in the HH:MM format
2. The UI uses `<input type="time">` elements to edit these values
3. Format conversion happens through `formatTimeValue` and `parseTimeValue` functions

## Summary of Fixes

The data in the `hooks/useCcrDowntimeData.ts` file is now correctly saving the `start_time` and `end_time` fields as defined in the schema.

We've removed extraneous fields like:

- `date_string`
- `date_year`
- `date_month`
- `date_day`

And we're making sure to properly pass through the legitimate fields:

- `date`
- `start_time`
- `end_time`
- `pic`
- `problem`
- `unit`
- `action` (optional)
- `corrective_action` (optional)
- `status` (optional)
