# Recommended E2E Testing Setup

## 1. Install Playwright
```bash
cd flask_react
npm install -D @playwright/test
npx playwright install
```

## 2. Example Test Structure

```typescript
// tests/manage-doc-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Manage Doc Flow', () => {
  test('non-logged-in user redirects to signup', async ({ page }) => {
    await page.goto('/try-it-now');
    
    // Upload document and complete flow
    await page.setInputFiles('input[type="file"]', 'test-lease.pdf');
    await page.waitForSelector('[data-testid="processing-complete"]');
    
    // Select firm sharing
    await page.click('input[value="firm"]');
    await page.click('button:has-text("Share with Firm")');
    
    // Wait for success dialog
    await page.waitForSelector('[data-testid="firm-success-dialog"]');
    
    // Click Manage Doc button
    await page.click('button:has-text("Manage Doc")');
    
    // Should redirect to signup
    await expect(page).toHaveURL('/auth/signup');
  });

  test('logged-in user navigates to document details', async ({ page }) => {
    // Login first
    await page.goto('/auth/signin');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Continue with try-it-now flow...
    await page.goto('/try-it-now');
    // ... rest of test
  });
});
```

## 3. Component Testing with React Testing Library

```typescript
// tests/components/FirmSharingSuccessDialog.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { FirmSharingSuccessDialog } from '@/app/try-it-now/dialogs/firm-sharing-success-dialog';

test('shows Manage Doc button when documentId provided', () => {
  render(
    <FirmSharingSuccessDialog 
      open={true}
      documentId="test-doc-id"
      // ... other props
    />
  );
  
  expect(screen.getByText('Manage Doc')).toBeInTheDocument();
});
```

## 4. API Testing

```typescript
// tests/api/document-registration.test.ts
test('document registration returns correct format', async () => {
  const response = await fetch('/register-document', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Test Document',
      file_path: '/test/path',
      user_id: 'test-user',
      sharing_type: 'firm'
    })
  });
  
  const data = await response.json();
  expect(data).toHaveProperty('document.id');
  expect(data.document.activities).toHaveLength(3); // Expected activities
});
```