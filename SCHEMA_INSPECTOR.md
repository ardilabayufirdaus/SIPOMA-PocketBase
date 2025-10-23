# Schema Inspector Script

This script helps inspect the PocketBase schema and sample data for the ccr_downtime_data collection.

## How to Run:

```bash
# Make sure PocketBase server is running
node schema-inspector.mjs
```

## Why This Script?

This script helps identify:

1. Actual field names in the PocketBase schema
2. Sample data format to verify field values
3. Detect inconsistencies between our code and database schema

## Expected Output

The script will output:

- The full schema of the collection
- A sample record from the collection
