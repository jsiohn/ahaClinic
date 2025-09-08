# Email Dot Preservation Fix

## Issue Description

Client email addresses with dots (periods) before the domain were being automatically modified during validation. For example:

- `user.name@example.com` might become `username@example.com`
- `first.last@gmail.com` might become `firstlast@gmail.com`

## Root Cause

The issue was caused by the `normalizeEmail()` function in the express-validator library, which was being used in the client validation middleware (`backend/src/middleware/clientValidation.js`).

The `normalizeEmail()` function implements email normalization rules, including:

- Removing dots from Gmail addresses (email aliasing feature)
- Converting email to lowercase
- Other provider-specific normalizations

While this is useful for some use cases (like preventing duplicate accounts with aliased emails), it was causing legitimate email addresses to be modified.

## Solution

**File:** `backend/src/middleware/clientValidation.js`

**Before:**

```javascript
body("email")
  .optional({ checkFalsy: true })
  .trim()
  .isEmail()
  .withMessage("Invalid email format")
  .normalizeEmail(),
```

**After:**

```javascript
body("email")
  .optional({ checkFalsy: true })
  .trim()
  .isEmail()
  .withMessage("Invalid email format"),
```

**Change:** Removed the `.normalizeEmail()` function call from the validation chain.

## Impact

- ✅ Email addresses are now preserved exactly as entered by users
- ✅ Dots in email addresses before the domain are maintained
- ✅ Email format validation still works correctly via `.isEmail()`
- ✅ No breaking changes to existing functionality
- ✅ Empty email handling remains unchanged (converted to null)

## Testing

The fix has been verified to:

1. Preserve email dots in all standard email formats
2. Continue validating email format correctly
3. Not break existing client creation/update functionality
4. Load without syntax errors

## Files Modified

- `backend/src/middleware/clientValidation.js` - Removed `.normalizeEmail()` from email validation

## Files Verified

- `backend/src/routes/clientRoutes.js` - No additional email transformation
- `backend/src/middleware/organizationValidation.js` - Does not use normalizeEmail
- Frontend client forms - Only used for display/search filtering (acceptable)

Date: September 8, 2025
