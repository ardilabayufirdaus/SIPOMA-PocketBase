# 2026-02-03 - 5

# Implementation Plan - Ubuntu Theme Redesign

This implementation plan outlines the steps taken to redesign the UI/UX of various forms and pages within the Plant Operations module to align with the Ubuntu Desktop theme.

## User Review Required

> [!IMPORTANT]
> The `tailwnind.config.js` file has been updated to set the global primary and secondary colors to Ubuntu Orange and Ubuntu Aubergine, respectively. This change affects the entire application.

## Proposed Changes

### Redesign Report Forms

#### [ReportSettingForm.tsx]

- Updated the header to use the Ubuntu Aubergine gradient (`from-[#772953] to-[#2C001E]`).
- Updated primary buttons to use Ubuntu Orange (`bg-[#E95420]`).
- Updated input focus rings and borders to match the Ubuntu theme.
- Replaced generic green/blue colors with Ubuntu-specific palettes for success, error, and information states.

#### [RkcReportSettingForm.tsx]

- Applied similar Ubuntu theme styling as `ReportSettingForm.tsx`.
- Ensured consistency in header gradients, button colors, and input styling.

#### [WhatsAppReportSettingForm.tsx]

- Updated focus rings to Ubuntu Orange (`#E95420`).
- Changed error borders and text to use Ubuntu Red (`#C7162B`) instead of generic red.
- Updated background colors to Ubuntu Gray (`#F9F9F9`).

### Verify Implementation

- Ran `npx tsc --noEmit` to ensure no TypeScript errors were introduced by the styling changes. The check passed successfully.
