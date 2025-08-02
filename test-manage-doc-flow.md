# Manual Testing Checklist for Manage Doc Flow

## Setup
- [ ] Frontend running on localhost:3000
- [ ] Backend running on localhost:5601
- [ ] Database connected (check Flask startup logs)

## Test 1: Non-Logged-In User
- [ ] Open incognito window → navigate to `/try-it-now`
- [ ] Upload test document (lease PDF)
- [ ] Complete processing flow
- [ ] Select "Share with Firm" privacy option
- [ ] Click "Share with Firm" button
- [ ] Verify success dialog shows "Manage Doc" button
- [ ] Click "Manage Doc" → expect redirect to `/auth/signup`
- [ ] Repeat for External, License, and Co-op sections

## Test 2: Logged-In User  
- [ ] Sign up/login at `/auth/signup`
- [ ] Navigate to `/try-it-now`
- [ ] Upload test document
- [ ] Complete processing flow
- [ ] Select "Share with Firm" privacy option
- [ ] Click "Share with Firm" button
- [ ] Verify success dialog shows "Manage Doc" button
- [ ] Click "Manage Doc" → expect redirect to `/dashboard/documents/{id}`
- [ ] Verify document details page loads correctly
- [ ] Check document activities are displayed
- [ ] Repeat for External, License, and Co-op sections

## Test 3: Database Verification
- [ ] Check Flask logs for document registration success
- [ ] Verify document appears in user's dashboard
- [ ] Verify blockchain activities are recorded
- [ ] Check document ID matches between try-it-now and dashboard

## Test 4: Error Scenarios
- [ ] Test with network disconnected
- [ ] Test auth service failure
- [ ] Test with invalid document states
- [ ] Verify graceful error handling

## Expected Results
✅ All "Manage Doc" buttons navigate correctly based on auth state
✅ Documents are properly saved and retrievable
✅ No console errors during navigation
✅ Smooth user experience between try-it-now and dashboard