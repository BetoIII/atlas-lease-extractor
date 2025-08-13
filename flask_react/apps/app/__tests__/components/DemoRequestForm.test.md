# DemoRequestForm Component Tests

## Test Plan

### Functionality Tests

#### ✅ Form Rendering
- **Test**: Should render all required form fields
- **Expected**: Name, email, and company input fields should be present
- **Implementation**: Test presence of all input elements with correct types and placeholders

- **Test**: Should render submit button with correct states
- **Expected**: Button should show "Request a Demo" by default, "Submitting..." when loading, "Loading..." when CSRF loading
- **Implementation**: Test button text changes based on component state

#### ✅ Form Validation
- **Test**: Should validate required fields
- **Expected**: Submit button should be disabled when name or email is empty
- **Implementation**: Test button disabled state with various input combinations

- **Test**: Should handle email format validation
- **Expected**: API should return error for invalid email formats
- **Implementation**: Test form submission with invalid email addresses

- **Test**: Should sanitize input data
- **Expected**: Form should handle special characters and prevent injection
- **Implementation**: Test with various special characters and potential XSS payloads

### Security Tests

#### 🔒 CSRF Protection
- **Test**: Should fetch CSRF token on component mount
- **Expected**: Component should call `/api/csrf-token` when rendered
- **Implementation**: Mock fetch and verify CSRF token API call

- **Test**: Should include CSRF token in form submissions
- **Expected**: Form submission should include CSRF token in headers
- **Implementation**: Test API request headers include X-CSRF-Token

- **Test**: Should handle CSRF token errors gracefully
- **Expected**: Should show error message if CSRF token fetch fails
- **Implementation**: Mock CSRF token API to return error and verify UI response

- **Test**: Should prevent form submission without CSRF token
- **Expected**: Submit button should be disabled until CSRF token is loaded
- **Implementation**: Test button state before and after CSRF token load

#### 🔒 XSS Prevention
- **Test**: Should safely render error messages
- **Expected**: Error messages should be escaped/sanitized
- **Implementation**: Test with malicious error response content

- **Test**: Should sanitize form input display
- **Expected**: Input values should not execute scripts if somehow manipulated
- **Implementation**: Security test with script injection attempts

### API Integration Tests

#### 🌐 Demo Request Submission
- **Test**: Should successfully submit valid form data
- **Expected**: Valid form data should result in success response and UI state change
- **Implementation**: Mock successful API response and verify success UI

- **Test**: Should handle API errors appropriately
- **Expected**: API errors should show user-friendly error messages
- **Implementation**: Mock API errors and verify error display

- **Test**: Should handle network failures
- **Expected**: Network errors should show appropriate fallback message
- **Implementation**: Mock network failure and verify error handling

#### 🔒 Request Security
- **Test**: Should send requests with proper security headers
- **Expected**: Requests should include CSRF token and credentials: 'same-origin'
- **Implementation**: Verify request configuration and headers

- **Test**: Should validate server response format
- **Expected**: Should handle unexpected response formats gracefully
- **Implementation**: Test with malformed API responses

### User Experience Tests

#### 🎨 Loading States
- **Test**: Should show loading indicator while fetching CSRF token
- **Expected**: Loading spinner should be visible during CSRF token fetch
- **Implementation**: Test loading UI state during token fetch

- **Test**: Should show loading state during form submission
- **Expected**: Button should be disabled and show "Submitting..." during API call
- **Implementation**: Test form submission loading state

#### ✅ Success Flow
- **Test**: Should show success message after submission
- **Expected**: Success UI should replace form with confirmation message
- **Implementation**: Test success state rendering and content

- **Test**: Should allow form reset after success
- **Expected**: "Submit Another Request" button should reset form state
- **Implementation**: Test form reset functionality

#### ❌ Error Handling
- **Test**: Should display error messages clearly
- **Expected**: Errors should be visible with appropriate styling and icons
- **Implementation**: Test error UI appearance and accessibility

### Accessibility Tests

#### ♿ Form Accessibility
- **Test**: Should have proper form labels and structure
- **Expected**: Form fields should be properly labeled for screen readers
- **Implementation**: Test form accessibility attributes

- **Test**: Should announce loading and error states
- **Expected**: State changes should be announced to assistive technology
- **Implementation**: Test ARIA live regions and announcements

- **Test**: Should have proper keyboard navigation
- **Expected**: All interactive elements should be keyboard accessible
- **Implementation**: Test tab order and keyboard interaction

### Manual Test Cases

#### Valid Submission Flow
1. Load form - should show loading spinner briefly
2. Fill in name: "John Doe"
3. Fill in email: "john@example.com"  
4. Fill in company: "Test Corp"
5. Click "Request a Demo" - should show "Submitting..."
6. Should show success message with checkmark icon
7. Click "Submit Another Request" - should reset form

#### Error Scenarios
1. Submit with empty name - button should be disabled
2. Submit with invalid email format - should show error
3. Submit with network disconnected - should show network error
4. Test with CSRF token expired - should refresh token and retry

#### Security Testing
1. Inspect network requests - should include CSRF token
2. Try to submit without CSRF token loaded - should be prevented
3. Check for XSS vulnerabilities in error messages
4. Verify external email link uses environment variable

## Test Results

### Security Implementation (Completed)
✅ CSRF protection implemented with token validation
✅ Email moved to environment variable (NEXT_PUBLIC_CONTACT_EMAIL)
✅ Request includes proper security headers
✅ Form validation prevents empty submissions

### Component Tests (To Implement)  
- [ ] React component rendering tests
- [ ] Form validation tests
- [ ] CSRF token integration tests
- [ ] Error handling tests
- [ ] Success flow tests
- [ ] Accessibility tests

## Security Notes

- All form submissions include CSRF token validation
- Requests sent with `credentials: 'same-origin'`
- Email address configurable via environment variable
- Input sanitization handled by React and API validation
- Error messages safely rendered (no dangerouslySetInnerHTML)
- No persistent storage of sensitive data

## Performance Notes

- CSRF token cached during component lifecycle
- Form validation runs on client-side before API submission
- Success state prevents multiple submissions
- Proper cleanup of async operations

## User Experience Notes

- Loading states clearly communicated to users
- Error messages are user-friendly and actionable
- Success flow provides clear confirmation
- Form can be easily reset for multiple submissions