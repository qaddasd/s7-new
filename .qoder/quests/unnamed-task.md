# Bug Fix Design Document: Video Loading, Achievement Notifications, and ByteSize Display Issues

## Overview

This document outlines the design for resolving three critical bugs in the S7 Robotics Platform that affect video playback in courses, achievement notifications for reaching 100 XP threshold, and ByteSize video display functionality.

## Problem Statement

### Issue 1: Videos Not Loading in Courses
**Symptom**: Videos uploaded to course lessons do not display or play when users view the course content.

**Root Cause Analysis**:
The issue stems from a disconnect between the admin upload workflow and the course display mechanism:

1. **Admin Side**: When creating lessons in `/admin/courses/new/[moduleId]/[lessonId]`, videos are uploaded to IndexedDB (browser local storage) with a `videoMediaId` reference
2. **Server Upload Gap**: The admin must manually click "Загрузить на сервер" (Upload to Server) button to transfer the video from IndexedDB to the backend `/uploads/media` endpoint
3. **Manual Process Failure**: If the admin forgets this manual upload step, the lesson is saved with only `videoMediaId` but no `videoUrl`
4. **Display Failure**: The course lesson viewer (`components/tabs/course-lesson-tab.tsx`) attempts to resolve the video using both `videoUrl` and `videoMediaId`, but the IndexedDB storage is admin-session-specific and not accessible to other users

**Technical Flow**:
```
Admin Upload → IndexedDB (videoMediaId) → [Manual Upload Required] → Server Storage (videoUrl) → User Playback
                                              ↑
                                        Missing Step
```

### Issue 2: Missing Achievement Notification for 100 XP Milestone
**Symptom**: When users earn 100 XP through correct quiz answers in courses, no toast notification appears informing them about the bonus email being sent.

**Root Cause Analysis**:

1. **Backend Certificate Generation**: The backend (`server/src/routes/courses.ts` lines 228-273) correctly detects the 100 XP threshold crossing and generates/sends a certificate via email
2. **Admin Notification Only**: Only admin users receive an in-app notification about the threshold being reached (lines 230-233)
3. **Frontend Logic Issue**: The frontend (`components/tabs/course-lesson-tab.tsx` lines 231-239) attempts to detect the threshold crossing by comparing user XP before and after answering
4. **Race Condition**: The frontend fetches the updated profile immediately after answer submission, but the comparison logic uses potentially stale data from the auth context
5. **Notification Gap**: Even when detected, the toast notification may not trigger reliably due to async timing issues

**Expected Behavior**: User should see a congratulatory toast notification immediately upon crossing 100 XP threshold stating: "Поздравляем! Вы успешно достигли 100 очков в этом курсе. На вашу почту отправлен бонус."

### Issue 3: ByteSize Videos Not Displaying After Upload
**Symptom**: Videos uploaded through `/admin/bytesize/new` do not appear in the ByteSize feed when users view the ByteSize tab.

**Root Cause Analysis**:

1. **Admin Upload Flow**: Videos are uploaded directly to the server via `/uploads/media` endpoint and stored with URLs like `/api/media/{filename}`
2. **Database Storage**: The ByteSize item is created in the database with normalized URL paths (lines 93-103 in `server/src/routes/admin.ts`)
3. **Feed Retrieval**: The ByteSize feed endpoint (`/bytesize` in `server/src/routes/bytesize.ts`) correctly retrieves all items from the database
4. **Frontend Display**: The ByteSize tab (`components/tabs/bytesize-tab.tsx`) fetches and displays items correctly
5. **Potential Issues**:
   - URL normalization inconsistency between admin creation and public feed
   - Media file access permissions
   - Missing video metadata or corruption during upload
   - Frontend filtering logic excluding newly uploaded items

**Investigation Required**: Need to verify if the issue is URL path resolution, media file serving, or frontend filtering logic.

## Proposed Solutions

### Solution 1: Automated Video Upload for Courses

**Approach**: Implement automatic server upload during course publish/save operations to eliminate manual upload step.

**Design Changes**:

#### Admin Course Creation Flow
1. **Automatic Upload on Save**: When admin saves a course or lesson, automatically upload all media files (videos, presentations, slides) from IndexedDB to the server
2. **Progress Indication**: Show upload progress UI with per-file status
3. **Error Handling**: Display clear error messages if upload fails and prevent course publication
4. **Validation**: Ensure all required media has valid server URLs before allowing course activation

#### Data Model Changes
No database schema changes required, but ensure consistent URL storage:
- Always store full `/api/media/` prefixed URLs in the database
- Remove reliance on IndexedDB for published course content

#### Workflow Modification

| Step | Current Behavior | Proposed Behavior |
|------|------------------|-------------------|
| Upload Video | Saved to IndexedDB only | Saved to IndexedDB + Background server upload initiated |
| Manual "Upload to Server" | Required button click | Removed - automatic process |
| Course Save/Publish | May have missing videoUrl | All media uploaded or clear error shown |
| User View Lesson | May fail if videoUrl missing | Always has valid videoUrl |

### Solution 2: Enhanced Achievement Notification System

**Approach**: Implement reliable client-side notification triggered by backend response data.

**Design Changes**:

#### Backend Enhancement
Modify the answer submission response (`POST /courses/:courseId/questions/:questionId/answer`) to include achievement notification metadata:

**Response Structure**:
```
{
  answerId: string,
  isCorrect: boolean,
  correctIndex: number,
  xpAwarded: number,
  userTotalXp: number,
  achievements: [
    {
      type: "milestone",
      threshold: 100,
      message: "Поздравляем! Вы успешно достигли 100 очков в этом курсе. На вашу почту отправлен бонус.",
      certificateSent: true
    }
  ]
}
```

#### Frontend Enhancement
Update the answer submission handler in `course-lesson-tab.tsx`:

1. Remove the race-condition-prone XP comparison logic
2. Directly use the `achievements` array from the response
3. Display toast notifications for each achievement immediately
4. Update user context XP after notifications are shown

#### Notification Display Strategy

| Trigger Condition | Notification Content | Display Duration |
|-------------------|---------------------|------------------|
| XP crosses 100 threshold | "Поздравляем! Вы успешно достигли 100 очков в этом курсе. На вашу почту отправлен бонус." | 6 seconds |
| Other milestones (future) | Configurable achievement-specific messages | 4 seconds |

### Solution 3: ByteSize Video Display Reliability

**Approach**: Implement comprehensive debugging and URL normalization fixes.

**Design Changes**:

#### URL Normalization Strategy
Ensure consistent URL handling across the entire ByteSize pipeline:

1. **Admin Upload**: Normalize URLs to `/api/media/` format immediately upon upload
2. **Database Storage**: Store normalized URLs consistently
3. **Feed Endpoint**: Apply URL normalization in response transformation
4. **Frontend Display**: Use `resolveMediaUrl` helper consistently for all video URLs

#### Verification Workflow

| Stage | Validation Point | Expected Result |
|-------|------------------|-----------------|
| Upload | File saved to disk | File exists at `MEDIA_DIR/{filename}` |
| Database | Record created | `videoUrl` field contains valid path |
| Feed API | Item returned | URL matches `/api/media/` or `/media/` pattern |
| Frontend | Video element src | Resolved to full accessible URL |

#### Debugging Enhancement
Add comprehensive logging at each stage:
- Admin upload: Log uploaded file path and generated URL
- Database creation: Log stored videoUrl value
- Feed retrieval: Log each item's URL transformation
- Frontend rendering: Log final resolved URLs before video element creation

#### Fallback Mechanism
If URL resolution fails:
1. Attempt alternative URL patterns (`/media/`, `/api/media/`, full absolute URL)
2. Log resolution attempts for debugging
3. Display user-friendly error message instead of broken video element

## Implementation Considerations

### Testing Strategy

#### Issue 1: Course Videos
**Test Scenarios**:
1. Create new course with video lesson → Publish → Verify video plays for enrolled users
2. Edit existing lesson with video → Save → Verify video remains accessible
3. Upload large video file → Verify progress indication and successful upload
4. Simulate upload failure → Verify clear error message prevents course publication

**Success Criteria**:
- 100% of uploaded videos accessible to enrolled users without manual intervention
- Upload failures clearly communicated to admin
- No orphaned IndexedDB entries

#### Issue 2: Achievement Notifications
**Test Scenarios**:
1. New user answers quiz questions → Reaches exactly 100 XP → Verify notification appears
2. User already at 99 XP → Answers question worth 20 XP → Verify notification appears
3. Multiple users reach 100 XP simultaneously → Verify each receives notification
4. User reaches 100 XP via different XP sources (course quiz, daily mission) → Verify notification consistency

**Success Criteria**:
- 100% notification delivery rate when threshold is crossed
- Notification displays within 500ms of answer submission
- Correct localized message displayed
- No duplicate notifications

#### Issue 3: ByteSize Videos
**Test Scenarios**:
1. Upload new ByteSize video → Verify appears in feed immediately
2. Upload video with special characters in filename → Verify plays correctly
3. Upload large ByteSize video (>100MB) → Verify successful upload and playback
4. Delete ByteSize video → Verify removed from feed and storage

**Success Criteria**:
- 100% of uploaded ByteSize videos visible in feed
- Video playback works across all browsers
- No broken video elements displayed

### Data Integrity

#### Course Media Migration
No migration required as the fix is forward-compatible. Existing courses with valid `videoUrl` fields will continue working. Only new uploads will benefit from automatic server upload.

#### Achievement Notification Backward Compatibility
The enhanced response structure is additive - clients expecting the old response format will continue functioning, while updated clients will benefit from achievement notifications.

#### ByteSize URL Consistency
Existing ByteSize items may need URL normalization. Consider running a one-time migration script to normalize all existing `videoUrl` values in the database to the standard `/api/media/` format.

### Performance Impact

#### Video Upload Performance
**Concern**: Automatic upload of large video files during course save may cause timeout or poor UX.

**Mitigation**:
- Implement chunked upload for files >50MB
- Show per-file upload progress with cancellation option
- Cache uploaded files to avoid re-upload on subsequent saves
- Use background upload queue with retry mechanism

#### Achievement Notification Performance
**Concern**: Additional database query to fetch user XP after answer submission.

**Mitigation**:
- Return updated user XP in the answer response (already fetched for threshold detection)
- Avoid extra database round-trip by including XP in the response payload

#### ByteSize Feed Performance
**Concern**: URL normalization on every feed request may impact response time.

**Mitigation**:
- Perform URL normalization once during creation/update
- Store normalized URLs in database
- Feed endpoint only needs simple retrieval without transformation

### Security Considerations

#### Media File Access Control
**Current State**: Media files served via static file middleware accessible to all authenticated users.

**Verification Required**:
- Ensure course videos are only accessible to enrolled users
- ByteSize videos should be publicly accessible (or authenticated users only)
- Admin-uploaded media should have appropriate access controls

**Proposed Access Control**:
- Course lesson videos: Require enrollment or admin role
- ByteSize videos: Public or authenticated users based on platform policy
- Admin media: Restrict to admin role only

#### Upload Size Limits
**Current Implementation**: 500MB limit enforced in `server/src/routes/uploads.ts`

**Recommendation**: Maintain current limit but provide clear error messaging to users when exceeded.

### Error Handling Strategy

#### Video Upload Failures
**Error Scenarios**:
- Network interruption during upload
- Server storage full
- File type not supported
- File size exceeds limit

**Handling**:
- Display specific error message for each scenario
- Provide retry mechanism for transient failures
- Save course draft state to prevent data loss
- Allow partial saves (other media uploaded successfully)

#### Achievement Notification Failures
**Error Scenarios**:
- Backend fails to send achievement data in response
- Frontend notification system unavailable
- User closes browser before notification displays

**Handling**:
- Graceful degradation - course functionality continues
- Log notification failures for monitoring
- Consider persistent notification inbox for missed achievements

#### ByteSize Display Failures
**Error Scenarios**:
- Video file deleted from storage but database record remains
- Corrupted video file
- Unsupported video format

**Handling**:
- Display placeholder with error message instead of broken video
- Provide admin tool to detect and clean orphaned records
- Validate video format during upload

## Rollout Plan

### Phase 1: Video Upload Automation (Priority: High)
**Scope**: Implement automatic server upload for course videos

**Steps**:
1. Update admin course creation flow to auto-upload on save
2. Add upload progress UI
3. Test with various file sizes and network conditions
4. Deploy to staging environment
5. User acceptance testing with admin users
6. Production deployment

**Timeline**: 1-2 weeks

### Phase 2: Achievement Notifications (Priority: High)
**Scope**: Implement reliable achievement notification system

**Steps**:
1. Update backend answer endpoint to include achievement data
2. Modify frontend to use achievement data from response
3. Add notification display logic
4. Test with various XP scenarios
5. Deploy to staging environment
6. Production deployment

**Timeline**: 1 week

### Phase 3: ByteSize Video Display Fix (Priority: Medium)
**Scope**: Resolve ByteSize video display issues

**Steps**:
1. Add comprehensive logging to identify root cause
2. Implement URL normalization fixes
3. Run migration script for existing records
4. Test upload and display flow
5. Deploy to staging environment
6. Production deployment

**Timeline**: 1 week

### Success Metrics

| Metric | Current State | Target State | Measurement Method |
|--------|---------------|--------------|-------------------|
| Course video playback success rate | Unknown (suspected <80%) | >99% | Monitor video load errors in frontend logs |
| Achievement notification delivery rate | 0% | >95% | Track notification displays vs. threshold crossings |
| ByteSize video display rate | Unknown (suspected <90%) | >99% | Monitor ByteSize feed API vs. displayed videos |
| Admin upload workflow time | ~3-5 minutes per lesson | <1 minute per lesson | User surveys and analytics |

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Automatic upload increases page load time | Medium | Medium | Implement background upload with progress UI |
| Notification spam if logic is flawed | Low | High | Thorough testing with edge cases; rate limiting |
| URL normalization breaks existing videos | Medium | High | Comprehensive testing; gradual rollout; rollback plan |
| Large video uploads timeout | Medium | Medium | Chunked upload; increase timeout limits |

## Alternative Approaches Considered

### Issue 1: Video Upload
**Alternative**: Keep manual upload but add prominent UI warnings
- **Pros**: Minimal code changes; maintains admin control
- **Cons**: Doesn't solve the core UX problem; still prone to human error
- **Decision**: Rejected in favor of automation

### Issue 2: Achievement Notifications
**Alternative**: Implement WebSocket-based real-time notifications from backend
- **Pros**: More scalable for future notification types; real-time delivery
- **Cons**: Additional infrastructure complexity; overkill for current need
- **Decision**: Rejected; response-based approach is simpler and sufficient

### Issue 3: ByteSize Display
**Alternative**: Rebuild ByteSize upload flow to match course upload pattern
- **Pros**: Consistent admin UX across platform
- **Cons**: Unnecessary rework; ByteSize upload already works correctly
- **Decision**: Rejected; focus on fixing display logic

## Conclusion

The three identified bugs stem from different root causes:
1. **Course videos**: Manual upload step creates UX friction and reliability issues
2. **Achievement notifications**: Frontend race condition prevents reliable notification delivery
3. **ByteSize videos**: URL normalization or display logic inconsistency

The proposed solutions address each issue at its root cause while maintaining backward compatibility and system stability. Implementation should be prioritized based on user impact, with course video automation and achievement notifications addressed first.
