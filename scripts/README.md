# Scripts Directory

This directory contains database migration scripts, setup utilities, and testing scripts used during development.

## Database Fix Scripts:

### `fix-email-index.js`

- **Purpose**: Fixed duplicate key error for clients with empty email addresses
- **Action**: Dropped unique index on email field and converted empty strings to null
- **Status**: ✅ Completed - Run once on July 7, 2025
- **Usage**: `node fix-email-index.js` (from backend directory with proper env)

### `fix-empty-emails.js`

- **Purpose**: Original attempt to fix email issues
- **Status**: Superseded by fix-email-index.js

### `test-empty-email.js`

- **Purpose**: Test script to verify email conversion logic
- **Status**: Development testing utility

## Setup & Management Scripts:

### `setup-users.js`

- **Purpose**: Initial user setup script for creating admin/test users
- **Usage**: `node setup-users.js` (from project root)
- **Status**: Setup utility - can be run as needed

### `test-rbac.js`

- **Purpose**: Test script for Role-Based Access Control (RBAC) functionality
- **Usage**: `node test-rbac.js` (from project root)
- **Status**: Testing utility for RBAC system verification

## Notes:

- Database fix scripts were needed due to legacy unique index constraints
- Current codebase properly handles null emails
- Database scripts should not need to be run again unless database is reset
- Setup scripts can be reused for new environments or testing
