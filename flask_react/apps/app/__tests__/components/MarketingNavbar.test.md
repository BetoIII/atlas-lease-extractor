# MarketingNavbar Component Tests

## Test Plan

### Functionality Tests

#### ✅ Navigation Links
- **Test**: Should render all required navigation links
- **Expected**: Links for "Why Atlas", "Why Tokenize", "Sign In", "Get Started" should be present
- **Implementation**: Test presence and href attributes of all links

- **Test**: Should use correct internal routing
- **Expected**: Internal links should use Next.js Link component with proper paths
- **Implementation**: Verify Link component usage for internal routes

#### ✅ External Link Security
- **Test**: Should safely handle external Twitter link
- **Expected**: Twitter link should use SafeExternalLink component with validation
- **Implementation**: Verify SafeExternalLink component is used and configured correctly

- **Test**: Should show fallback for invalid external URLs
- **Expected**: If URL validation fails, should show disabled fallback text
- **Implementation**: Mock URL validation to return false and verify fallback rendering

### Security Tests

#### 🔒 URL Validation
- **Test**: Should validate external URLs against allowlist
- **Expected**: Only whitelisted domains (x.com, twitter.com, etc.) should be allowed
- **Implementation**: Unit test of SafeExternalLink with various URLs

- **Test**: Should block malicious URLs
- **Expected**: URLs like `javascript:alert('xss')` or `data:text/html,<script>` should be blocked
- **Implementation**: Security test with malicious URL inputs

- **Test**: Should require HTTPS for external links
- **Expected**: HTTP links should be blocked, only HTTPS allowed
- **Implementation**: Test with http:// URLs vs https:// URLs

#### 🔒 XSS Prevention
- **Test**: Should sanitize any dynamic content
- **Expected**: No user input should be rendered without sanitization
- **Implementation**: Review component for dynamic content sources

### Accessibility Tests

#### ♿ ARIA and Semantic HTML
- **Test**: Should have proper semantic structure
- **Expected**: Should use `<header>`, `<nav>` elements appropriately
- **Implementation**: Check HTML structure and ARIA attributes

- **Test**: Should have accessible link text
- **Expected**: All links should have descriptive text or aria-labels
- **Implementation**: Verify link accessibility

- **Test**: Should have proper focus management
- **Expected**: Links should be keyboard accessible with visible focus indicators
- **Implementation**: Test keyboard navigation

### Responsive Design Tests

#### 📱 Layout Adaptation
- **Test**: Should adapt to different screen sizes
- **Expected**: Navigation should work on mobile and desktop viewports
- **Implementation**: CSS/viewport testing

- **Test**: Should handle logo and brand text properly
- **Expected**: Logo should have proper alt text and sizing
- **Implementation**: Test image accessibility and responsive behavior

### Integration Tests

#### ⚙️ UI Library Integration
- **Test**: Should properly use @atlas/ui Button components
- **Expected**: Buttons should render with correct variants and props
- **Implementation**: Test Button component integration

- **Test**: Should integrate with Next.js Image component
- **Expected**: Logo should use Next.js Image with proper optimization
- **Implementation**: Verify Image component usage

### Manual Test Cases

#### Browser Testing
1. Click "Why Atlas" - should navigate to `/why-atlas`
2. Click "Why Tokenize" - should navigate to `/why-tokenize`  
3. Click "Sign In" - should navigate to `/auth/signin`
4. Click "Get Started" - should navigate to `/auth/signup`
5. Click Twitter link - should open https://x.com/betoiii in new tab
6. Test with blocked Twitter URL - should show fallback text

#### Security Testing
1. Inspect Twitter link - should have `rel="noopener noreferrer"`
2. Verify no inline JavaScript or dangerous attributes
3. Test with network blocked - should handle gracefully

## Test Results

### URL Security Tests (Completed)
✅ SafeExternalLink component implemented with domain validation
✅ HTTPS-only enforcement for external links
✅ Malicious URL blocking verified
✅ Proper `rel="noopener noreferrer"` attributes

### Component Tests (To Implement)
- [ ] React component rendering tests
- [ ] Navigation link functionality tests
- [ ] Button integration tests
- [ ] Image component tests
- [ ] Responsive design tests

## Security Notes

- External Twitter link now uses SafeExternalLink with URL validation
- Domain allowlist includes: x.com, twitter.com, linkedin.com, github.com, atlasdata.coop
- All external links open in new tab with security attributes
- Fallback UI shown for blocked/invalid URLs
- No user-controlled content in component (static links only)

## Accessibility Notes

- All links have descriptive text
- Semantic HTML structure with header and nav elements
- Logo has proper alt text
- Keyboard navigation supported
- Focus indicators visible